import { Address, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import { compile, NetworkProvider, sleep } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Lecture address'));
    const amount = args.length > 1 ? args[1] : await ui.input('Pay amount');

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const lecture = provider.open(Lecture.createFromAddress(address));
    const { paymentCount: beforePaymentCount } = await lecture.getData();

    const result = await lecture.sendPay(provider.sender(), toNano(amount));

    let attempt = 1;
    let afterPaymentCount = beforePaymentCount;
    while (beforePaymentCount == afterPaymentCount && attempt <= 10) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        attempt++;

        const _data = await lecture.getData();
        afterPaymentCount = _data.paymentCount;
    }

    ui.clearActionPrompt();
    ui.write('Paid successfully!');
}
