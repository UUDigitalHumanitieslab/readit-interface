import LandingView from "../landing/landing-view";
import ldChannel from '../common-rdf/radio';
import './exploration-data';

export default new LandingView({ model: ldChannel.request('statistics') });
