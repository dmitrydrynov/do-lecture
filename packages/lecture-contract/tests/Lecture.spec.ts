import { Blockchain, SandboxContract, TreasuryContract, Event, EventAccountDestroyed } from '@ton-community/sandbox';
import { Address, Cell, fromNano, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import '@ton-community/test-utils';
import { compile, sleep } from '@ton-community/blueprint';

describe('Lecture', () => {
    jest.setTimeout(10000);

    let code: Cell;
    let blockchain: Blockchain;
    let manager: SandboxContract<TreasuryContract>;
    let lecturers: SandboxContract<TreasuryContract>[];
    let senders: SandboxContract<TreasuryContract>[];

    const deployLecture = async ({ startTime, goal }: { startTime: number; goal: bigint }) => {
        const lecture = blockchain.openContract(
            Lecture.createFromConfig(
                {
                    startTime,
                    goal,
                    lecturerAddress: lecturers[0].address,
                    managerAddress: manager.address,
                },
                code
            )
        );

        const deployResult = await lecture.sendDeploy(lecturers[0].getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: lecturers[0].address,
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

    beforeAll(async () => {
        code = await compile('Lecture');
    });

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        manager = await blockchain.treasury('manager');
        lecturers = [
            await blockchain.treasury('lecturer1'),
            await blockchain.treasury('lecturer2'),
            await blockchain.treasury('lecturer3'),
            await blockchain.treasury('lecturer4'),
        ];
        senders = [
            await blockchain.treasury('sender1'),
            await blockchain.treasury('sender2'),
            await blockchain.treasury('sender3'),
            await blockchain.treasury('sender4'),
        ];
    });

    it('Test 1. Should deploy', async () => {
        await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
    });

    it('Test 2. Should cancel', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
        const cancelResult = await lecture.sendCancel(lecturers[0].getSender());

        expect(cancelResult.transactions).toHaveTransaction({
            from: lecturers[0].address,
            to: lecture.address,
            destroyed: true,
        });
    });

    it('Test 3. Should accept payments from users', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });

        await lecture.sendPay(senders[0].getSender(), toNano('1'));
        await lecture.sendPay(senders[1].getSender(), toNano('2.5'));
        await lecture.sendPay(senders[2].getSender(), toNano('14'));

        /** Check payments through getPayments */
        const payments = await lecture.getPayments();
        expect(payments?.values().length).toBe(3);
        expect(
            payments?.values().map((p) => ({ address: p.address.toString(), value: fromNano(p.value) }))
        ).toContainEqual({
            address: senders[0].address.toString(),
            value: '1',
        });

        /** Check payment through getPaymentsByUser */
        const paymentLatest = await lecture.getPaymentsByUser(senders[2].address);
        expect(
            paymentLatest?.values().map((p) => ({ address: p.address.toString(), value: fromNano(p.value) }))
        ).toContainEqual({
            address: senders[2].address.toString(),
            value: '14',
        });

        /** Check paid amount through */
        const { goal, left } = await lecture.getLeftAndGoal();
        const paid = goal - left;

        expect(fromNano(paid)).toBe('17.5');
    });

    it('Test 4. Manager cannot pay', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });
        const result = await lecture.sendPay(manager.getSender(), toNano('1'));

        expect(result.transactions).toHaveTransaction({
            from: manager.address,
            to: lecture.address,
            exitCode: Lecture.Error.PAY_SENDER_IS_MANAGER,
        });
    });

    it('Test 5. Should throw if the value is less than minimum price', async () => {
        const lecture = await deployLecture({ startTime: setNow('plus', 4), goal: toNano('10') });

        const result1 = await lecture.sendPay(senders[0].getSender(), toNano('0.03'));
        const result2 = await lecture.sendPay(senders[0].getSender(), toNano('0.51'));

        expect(result1.transactions).toHaveTransaction({
            from: senders[0].address,
            to: lecture.address,
            exitCode: Lecture.Error.PAY_NOT_ENOUGH,
        });
        expect(result2.transactions).toHaveTransaction({
            from: senders[0].address,
            to: lecture.address,
            success: true,
        });
    });

    it('Test 6. Should not pay after lecture start', async () => {
        const lecture = await deployLecture({ startTime: setNow('minus', 3), goal: toNano('10') });

        const result = await lecture.sendPay(senders[0].getSender(), toNano('0.5'));

        expect(result.transactions).toHaveTransaction({
            from: senders[0].address,
            to: lecture.address,
            exitCode: Lecture.Error.PAY_AFTER_START,
        });
    });

    it('Test 7. Should not accept payments if the lecture already began', async function () {
        const lecture = await deployLecture({ startTime: setNow('plus', 3, 'seconds'), goal: toNano('10') });

        const res1 = await lecture.sendPay(senders[0].getSender(), toNano('10'));

        expect(res1.transactions).toHaveTransaction({
            from: senders[0].address,
            to: lecture.address,
            success: true,
        });

        await sleep(5000);

        const res2 = await lecture.sendPay(senders[0].getSender(), toNano('20'));

        expect(res2.transactions).toHaveTransaction({
            from: senders[0].address,
            to: lecture.address,
            success: false,
        });
    });

    it('Test 8. Should accept payments even after reaching the goal', async function () {
        const lecture = await deployLecture({ startTime: setNow('plus', 3, 'seconds'), goal: toNano(100) });

        await lecture.sendPay(senders[0].getSender(), toNano(10));
        await lecture.sendPay(senders[1].getSender(), toNano(20));
        await lecture.sendPay(senders[2].getSender(), toNano(30));
        await lecture.sendPay(senders[3].getSender(), toNano(40));
        await lecture.sendPay(senders[0].getSender(), toNano(50));

        const { left, goal } = await lecture.getLeftAndGoal();
        expect(left).toEqual(Number(toNano(-50)));

        const res1 = await lecture.getPaymentsByUser(senders[0].address);
        const res2 = await lecture.getPaymentsByUser(senders[1].address);
        const res3 = await lecture.getPaymentsByUser(senders[2].address);
        const res4 = await lecture.getPaymentsByUser(senders[3].address);

        expect(
            res1
                ?.values()
                .map((r) => r.value)
                .reduce((a, b) => a + b)
        ).toEqual(Number(toNano(60)));
        expect(res2?.values().map((r) => r.value)).toContain(Number(toNano(20)));
        expect(res3?.values().map((r) => r.value)).toContain(Number(toNano(30)));
        expect(res4?.values().map((r) => r.value)).toContain(Number(toNano(40)));
    });

    it('Test 9. Should not start if it is too early', async function () {
        const lecture = await deployLecture({ startTime: setNow('plus', 3), goal: toNano(100) });
        await lecture.sendPay(senders[0].getSender(), toNano(25));

        const payment_res = await lecture.getPaymentsByUser(senders[0].address);

        const { left, goal } = await lecture.getLeftAndGoal();
        expect(left).toEqual(Number(toNano(75)));
        expect(payment_res?.values().map((r) => r.value)).toContain(Number(toNano(25)));
        await expect(lecture.sendTryStart()).rejects.toThrow();
    });

    it('Test 10. Should start if the goal is reached', async function () {
        const lecture = await deployLecture({ startTime: setNow('plus', 3, 'seconds'), goal: toNano(100) });

        await lecture.sendPay(senders[0].getSender(), toNano(25));
        await lecture.sendPay(senders[1].getSender(), toNano(75));

        const payment_res1 = await lecture.getPaymentsByUser(senders[0].address);
        const payment_res2 = await lecture.getPaymentsByUser(senders[1].address);

        expect(payment_res1?.values().map((r) => r.value)).toContain(Number(toNano(25)));
        expect(payment_res2?.values().map((r) => r.value)).toContain(Number(toNano(75)));

        const { left, goal } = await lecture.getLeftAndGoal();
        expect(left).toBeLessThanOrEqual(Number(toNano(0)));

        await sleep(5000);
        await expect(lecture.sendTryStart()).rejects.toThrow();
    });
});
