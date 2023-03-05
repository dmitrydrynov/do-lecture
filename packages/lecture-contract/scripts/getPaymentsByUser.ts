import { Address, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import { NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Lecture address'));
    const senderAddress = Address.parse(args.length > 1 ? args[1] : await ui.input('Sender address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const lecture = provider.open(Lecture.createFromAddress(address));
    const result = await lecture.getPaymentsByUser(senderAddress);

    console.log('User Payments', result);

    ui.clearActionPrompt();
    ui.write('Lecture payments got!');
}
