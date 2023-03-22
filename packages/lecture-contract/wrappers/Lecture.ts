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
    serviceAddress: Address;
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
        .storeAddress(config.serviceAddress)
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

enum LectureError {
    PAY_NOT_ENOUGH = 700,
    PAY_AFTER_START = 701,
    REPORT_BEFORE_START = 702,
    REPORT_NO_PAYMENTS = 703,
    SOLVE_SENDER_ISNOT_MANAGER = 704,
    SOLVE_BEFORE_START = 705,
    SOLVE_NO_REPORTS = 706,
    CANCEL_SENDER_ISNOT_LECTURER = 707,
    PAY_SENDER_IS_MANAGER = 708,
    REPORT_SENDER_IS_LECTURER = 709,
    TRY_START_TOO_EARLY = 710,
    TRY_PAYOUT_TOO_EARLY = 711,
    TRY_PAYOUT_WITH_REPORTS = 712,
    DESTROY_SENDER_ISNOT_CONTRACT = 713,
    REPORT_SENDER_IS_MANAGER = 714,
    REPORT_SENDER_IS_SERVICE = 715,
    DEPLOY_PRICE_LESS = 799,
}

export class Lecture implements Contract {
    static MINIMUM_PAYMENT = 0.5;
    static START_LESSON_PRICE = 1;
    static SERVICE_FEE_AMOUNT = 5;
    static END_FUNDING_PERIOD = 7200;
    static END_REPORTING_PERIOD = 7200;

    static OPERATION = {
        PAY: 0x0,
        REPORT: 0x15137b01,
        SOLVE: 0x52ae5647,
        CANCEL: 0x2bff4ddf,
        TRY_START: 0x4733f979,
        TRY_PAYOUT: 0x6ac5796b,
    };

    private static exitCodesAsText: Record<number, string> = {
        700: 'Error 700',
        701: 'Error 701',
        702: 'Error 702',
        703: 'Error 703',
        704: 'Error 704',
        705: 'Error 705',
        706: 'Error 706',
        707: 'Error 707',
        708: 'Error 708',
        709: 'Error 709',
        710: 'Error 710',
        711: 'Error 711',
        712: 'Error 712',
        713: 'Error 713',
        714: 'Error 714',
        715: 'Error 715',
        799:
            'The lecture has not been created. The cost of publishing a new lecture is below the minimum (' +
            Lecture.START_LESSON_PRICE +
            ' TON)',
    };

    static errorAsText = (exitCode: LectureError) => {
        return Lecture.exitCodesAsText[exitCode];
    };

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Lecture(address);
    }

    static createFromConfig(config: LectureConfig, code: Cell, workchain = 0) {
        const data = lectureConfigToCell(config);
        const stateInit = { code, data };

        return new Lecture(contractAddress(workchain, stateInit), stateInit);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value?: bigint) {
        try {
            await provider.internal(via, {
                value: value || toNano(Lecture.START_LESSON_PRICE),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell().endCell(),
            });
        } catch (e: any) {
            throw e;
        }
    }

    async sendPay(provider: ContractProvider, via: Sender, value: bigint) {
        try {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell().storeUint(Lecture.OPERATION.PAY, 32).endCell(),
            });
        } catch (e: any) {
            throw e;
        }
    }

    async sendCancel(provider: ContractProvider, via: Sender) {
        try {
            const body = beginCell().storeUint(Lecture.OPERATION.CANCEL, 32).endCell();
            provider.getState();

            await provider.internal(via, {
                value: toNano('0.1'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body,
            });
        } catch (e: any) {
            throw e;
        }
    }

    // if not funded payback money for senders, if funned - nothing
    async sendTryStart(provider: ContractProvider) {
        try {
            await provider.external(beginCell().storeUint(Lecture.OPERATION.TRY_START, 32).endCell());
        } catch (e: any) {
            throw e;
        }
    }

    // if no reports and reporting period has canceled
    async sendTryPayout(provider: ContractProvider) {
        try {
            await provider.external(beginCell().storeUint(Lecture.OPERATION.TRY_PAYOUT, 32).endCell());
        } catch (e: any) {
            throw e;
        }
    }

    // user function, user isn't a sender or a teacher, can do after lecture start
    async sendReport(provider: ContractProvider, via: Sender) {
        try {
            await provider.internal(via, {
                value: toNano('0.1'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell().storeUint(Lecture.OPERATION.REPORT, 32).endCell(),
            });
        } catch (e: any) {
            throw e;
        }
    }

    // manager function, manager isn't a sender or a teacher, can do after lecture start and before destroy
    async sendReportSolve(provider: ContractProvider, via: Sender, reportNo: number, satisfy: boolean) {
        try {
            await provider.internal(via, {
                value: toNano('0.1'),
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: beginCell()
                    .storeUint(Lecture.OPERATION.SOLVE, 32)
                    .storeUint(reportNo, 16)
                    .storeBit(satisfy)
                    .endCell(),
            });
        } catch (e: any) {
            throw e;
        }
    }

    async getStartTime(provider: ContractProvider) {
        try {
            const result = await provider.get('get_start_time', []);
            return result.stack.readNumber();
        } catch (e: any) {
            throw e;
        }
    }

    async getLeftAndGoal(provider: ContractProvider) {
        try {
            const result = await provider.get('get_left_goal', []);
            return { left: result.stack.readNumber(), goal: result.stack.readNumber() };
        } catch (e: any) {
            throw e;
        }
    }

    async getPaymentsByUser(provider: ContractProvider, address: Address) {
        try {
            const tb = new TupleBuilder();
            tb.writeAddress(address);
            const result = await provider.get('get_payments_by_user', tb.build());

            if (result.stack.peek().type === 'int') return;

            const payments = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), PaymentsDictValue);

            return payments;
        } catch (e: any) {
            throw e;
        }
    }

    async getPayments(provider: ContractProvider) {
        try {
            const result = await provider.get('get_payments', []);
            const payments = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), PaymentsDictValue);

            return payments;
        } catch (e: any) {
            throw e;
        }
    }

    async getReports(provider: ContractProvider) {
        try {
            const result = await provider.get('get_reports', []);
            const reports = result.stack.readCell().beginParse().loadDict(Dictionary.Keys.Uint(16), ReportsDictValue);

            return reports;
        } catch (e: any) {
            throw e;
        }
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
                serviceAddress: tuple.readCell().beginParse().loadAddress(),
                managerAddress: tuple.readCell().beginParse().loadAddress(),
                lecturerAddress: tuple.readCell().beginParse().loadAddress(),
                paymentCount: tuple.readNumber(),
                reportsCount: tuple.readNumber(),
            };

            data.paidTotal = data.goal - data.left;

            return data;
        } catch (e: any) {
            throw e;
        }
    }

    async getVersion(provider: ContractProvider) {
        try {
            const result = await provider.get('get_version', []);
            const version = result.stack.readNumber();

            return version;
        } catch (e: any) {
            throw e;
        }
    }
}
