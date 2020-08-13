import channel from '../explorer/radio';

import router from '../global/exploration-router';
import explorer from '../global/explorer-view';
import '../global/explorer-controller';

channel.on('currentRoute', route => router.navigate(route));
