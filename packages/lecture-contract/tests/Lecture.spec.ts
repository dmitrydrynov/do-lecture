import { Blockchain, SandboxContract, TreasuryContract, Event, EventAccountDestroyed } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Lecture', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Lecture');
    });

    let blockchain: Blockchain;
    let lecture: SandboxContract<Lecture>;
    let manager: SandboxContract<TreasuryContract>;
    let lecturer: SandboxContract<TreasuryContract>;
    let seed = 0;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        const now = Math.floor(Date.now() / 1000);
        const startTime = now + 60 * 60 * 4 + seed;
        lecturer = await blockchain.treasury('lecturer' + seed);
        manager = await blockchain.treasury('manager');

        lecture = blockchain.openContract(
            Lecture.createFromConfig(
                {
                    startTime,
                    goal: toNano('20'),
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

        seed++;
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lecture are ready to use
    });

    // it('should cancel', async () => {
    //     const cancelResult = await lecture.sendCancel(lecturer.getSender());

    //     const res = cancelResult.events
    //     expect(cancelResult.events).toContainEqual<Event>({ type: 'account_destroyed', account: lecture.address });
    // });
});
