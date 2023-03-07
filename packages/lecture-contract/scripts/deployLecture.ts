import { Address, toNano } from 'ton-core';
import { Lecture } from '../wrappers/Lecture';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const lecture = provider.open(
        Lecture.createFromConfig(
            {
                startTime: Math.floor(Date.now() / 1000 + 60 * 60 * 4),
                goal: toNano('1.5'),
                lecturerAddress: Address.parse('EQB6LmhSEwtpVlX5RPU90t0DPoYgituWnFbOpi78VKcdrJAH'),
                managerAddress: Address.parse('EQAhqhwmezCswiYw-WRl1HzQccWINfVdS9WTTy9a20Ck58hE'),
            },
            await compile('Lecture')
        )
    );

    await lecture.sendDeploy(provider.sender(), toNano('1.0'));

    await provider.waitForDeploy(lecture.address, 60);

    console.log('Start Time', await lecture.getStartTime());
}
