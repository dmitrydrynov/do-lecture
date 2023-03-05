import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
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

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        lecture = blockchain.openContract(Lecture.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await lecture.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lecture.address,
            deploy: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lecture are ready to use
    });
});
