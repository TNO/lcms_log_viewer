import m from 'mithril';
import 'material-icons/iconfont/material-icons.css';
import 'materialize-css/dist/css/materialize.min.css';
import './css/style.css';
import { routingSvc } from './services/routing-service';
// import { registerServiceWorker } from './services/register-service-worker';

// registerServiceWorker({
//   onSuccess: (registration) => console.log('SW registered: ', registration),
//   onUpdate: (registration) => console.log('SW updated: ', registration),
// });

document.documentElement.setAttribute('lang', 'nl');

m.route(document.body, routingSvc.defaultRoute, routingSvc.routingTable());
