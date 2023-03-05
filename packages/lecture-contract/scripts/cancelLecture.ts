import { Address, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Lecture address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const lecture = provider.open(Lecture.createFromAddress(address));
    await lecture.sendCancel(provider.sender());

    ui.write('Waiting for lecture to cancelling...');

    let attempt = 1;
    while (await provider.isContractDeployed(address)) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Lecture cancel successfully!');
}
