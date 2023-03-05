import { TonClient } from 'ton';
import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    DictionaryValue,
    Sender,
    SendMode,
    toNano,
    TupleBuilder,
} from 'ton-core';

export type LectureConfig = {
    startTime: number;
    managerAddress: Address;
    lecturerAddress: Address;
    goal: bigint;
    left?: bigint;
    reports?: any;
    paid?: any;
};

export interface PaymentsLibrary {
    address: Address;
    timestamp: number;
    value: number;
}

export interface ReportsLibrary {
    address: Address;
    timestamp: number;
}

export function lectureConfigToCell(config: LectureConfig): Cell {
    return beginCell()
        .storeUint(config.startTime, 32)
        .storeAddress(config.managerAddress)
        .storeAddress(config.lecturerAddress)
        .storeUint(config.goal, 64)
        .storeInt(config.goal, 64)
        .storeDict()
        .storeDict()
        .endCell();
}

const PaymentsDictValue: DictionaryValue<PaymentsLibrary> = {
    serialize(src, builder) {
        builder.storeAddress(src.address);
        builder.storeUint(src.timestamp, 32);
        builder.storeUint(src.value, 64);
    },
    parse(src) {
        return {
            address: src.loadAddress(),
            timestamp: src.loadUint(32),
            value: src.loadUint(64),
        };
    },
};

const ReportsDictValue: DictionaryValue<ReportsLibrary> = {
    serialize(src, builder) {
        builder.storeAddress(src.address);
        builder.storeUint(src.timestamp, 32);
    },
    parse(src) {
        return {
            address: src.loadAddress(),
            timestamp: src.loadUint(32),
        };
    },
};

export class Lecture implements Contract {
    static OPERATION = {
        PAY: 0x0,
        REPORT: 0x15137b01,
        SOLVE: 0x52ae5647,
        PAYBACK: 0x2bff4ddf,
        TRY_START: 0x4733f979,
        TRY_PAYOUT: 0x6ac5796b,
    };

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Lecture(address);
    }

    static createFromConfig(config: LectureConfig, code: Cell, workchain = 0) {
        const data = lectureConfigToCell(config);
        const init = { code, data };
        
        return new Lecture(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendPay(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Lecture.OPERATION.PAY, 32).endCell(),
        });
    }

    async sendCancel(provider: ContractProvider, via: Sender) {
        const body = beginCell().storeUint(Lecture.OPERATION.PAYBACK, 32).endCell();

        await provider.internal(via, {
            value: toNano('0.1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body,
        });
    }

    async sendReport(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Lecture.OPERATION.REPORT, 32).endCell(),
        });
    }

    async getStartTime(provider: ContractProvider) {
        const result = await provider.get('get_start_time', []);
        return result.stack.readNumber();
    }

    async getLeftAndGoal(provider: ContractProvider) {
        const result = await provider.get('get_left_goal', []);
        return { left: result.stack.readNumber(), goal: result.stack.readNumber() };
    }

    async getPaymentsByUser(provider: ContractProvider, address: Address) {
        const tupleBuilder = new TupleBuilder();
        tupleBuilder.writeAddress(address);
        const result = await provider.get('get_payments_by_user', tupleBuilder.build());
        const payments = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), PaymentsDictValue);

        return payments;
    }

    async getPayments(provider: ContractProvider) {
        const result = await provider.get('get_payments', []);
        const payments = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), PaymentsDictValue);

        return payments;
    }

    async getReports(provider: ContractProvider) {
        const result = await provider.get('get_reports', []);
        const reports = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), ReportsDictValue);

        return reports;
    }

    async getData(provider: ContractProvider) {
        try {
            const { state } = await provider.getState();
            let data: any = { state: state.type };

            if (data.state !== 'active') {
                return data;
            }

            const result = await provider.get('get_all_data', []);
            const tuple = result.stack;

            data = {
                ...data,
                startTime: tuple.readNumber(),
                goal: tuple.readNumber(),
                left: tuple.readNumber(),
                managerAddress: tuple.readCell().beginParse().loadAddress(),
                lecturerAddress: tuple.readCell().beginParse().loadAddress(),
                paymentCount: tuple.readNumber(),
                reportsCount: tuple.readNumber(),
            };

            data.paidTotal = data.goal - data.left;

            return data;
        } catch (error: any) {
            console.log(error);
            return;
        }
    }
}
