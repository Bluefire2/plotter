import DiscreteDistribution from './DiscreteDistribution';
import NBinomial from "./NBinomial";

export default class Geometric extends DiscreteDistribution {
    constructor(p) {
        super(...arguments);

        return new NBinomial(1, p);
    }
}