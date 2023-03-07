import { Blockchain, SandboxContract, TreasuryContract, Event, EventAccountDestroyed } from '@ton-community/sandbox';
import { Address, Cell, fromNano, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Lecture', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let manager: SandboxContract<TreasuryContract>;
    let lecturer: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        code = await compile('Lecture');
    });

    const deployLecture = async ({ startTime, goal }: { startTime: number; goal: bigint }) => {
        const lecture = blockchain.openContract(
            Lecture.createFromConfig(
                {
                    startTime,
                    goal,
                    lecturerAddress: lecturer.address,
                    managerAddress: manager.address,
                },
                code
            )
        );

        const deployResult = await lecture.sendDeploy(lecturer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: lecturer.address,
            to: lecture.address,
            deploy: true,
        });

        return lecture;
    };

    const setNow = (
        command: 'plus' | 'minus' = 'plus',
        delta: number = 0,
        part: 'hours' | 'minutes' | 'seconds' = 'hours'
    ) => {
        const now = Math.floor(Date.now() / 1000);

        switch (part) {
            case 'hours':
                delta = 60 * 60 * delta;
            case 'minutes':
                delta = 60 * delta;
            case 'seconds':
                delta = delta;
        }

        return command == 'plus' ? now + delta : now - delta;
    };

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        lecturer = await blockchain.treasury('lecturer');
        manager = await blockchain.treasury('manager');
    });

    it('should deploy', async () => {
        await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
    });

    it('should cancel', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
        const cancelResult = await lecture.sendCancel(lecturer.getSender());

        expect(cancelResult.transactions).toHaveTransaction({
            from: lecturer.address,
            to: lecture.address,
            destroyed: true,
        });
    });

    it('should pay', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });

        const sender1 = await blockchain.treasury('sender1');
        const sender2 = await blockchain.treasury('sender2');
        const sender3 = await blockchain.treasury('sender3');

        await lecture.sendPay(sender1.getSender(), toNano('1'));
        await lecture.sendPay(sender2.getSender(), toNano('2.5'));
        await lecture.sendPay(sender3.getSender(), toNano('14'));

        /** Check payments through getPayments */
        const payments = await lecture.getPayments();
        expect(payments?.values().length).toBe(3);
        expect(
            payments?.values().map((p) => ({ address: p.address.toString(), value: fromNano(p.value) }))
        ).toContainEqual({
            address: sender1.address.toString(),
            value: '1',
        });

        /** Check payment through getPaymentsByUser */
        const paymentLatest = await lecture.getPaymentsByUser(sender3.address);
        expect(
            paymentLatest?.values().map((p) => ({ address: p.address.toString(), value: fromNano(p.value) }))
        ).toContainEqual({
            address: sender3.address.toString(),
            value: '14',
        });

        /** Check paid amount through */
        const { goal, left } = await lecture.getLeftAndGoal();
        const paid = goal - left;

        expect(fromNano(paid)).toBe('17.5');
    });

    it('manager cannot pay', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
        const result = await lecture.sendPay(manager.getSender(), toNano('1'));

        expect(result.transactions).toHaveTransaction({
            from: manager.address,
            to: lecture.address,
            exitCode: 708,
        });
    });

    it('pay should be more then minimum pay amount', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
        const sender = await blockchain.treasury('sender');

        const result1 = await lecture.sendPay(sender.getSender(), toNano('0.03'));
        const result2 = await lecture.sendPay(sender.getSender(), toNano('0.51'));

        expect(result1.transactions).toHaveTransaction({
            from: sender.address,
            to: lecture.address,
            exitCode: 700,
        });
        expect(result2.transactions).toHaveTransaction({
            from: sender.address,
            to: lecture.address,
            success: true,
        });
    });

    it('shouldnt pay after lecture start', async () => {
        const sender = await blockchain.treasury('sender');
        const lecture = await deployLecture({ startTime: setNow('plus', 3), goal: toNano('10') });

        const result = await lecture.sendPay(sender.getSender(), toNano('0.5'));

        expect(result.transactions).toHaveTransaction({
            from: sender.address,
            to: lecture.address,
            exitCode: 701,
        });
    });
});
