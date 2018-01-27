import DiscreteDistribution from './DiscreteDistribution';
import Binomial from "./Binomial";

export default class NBinomial extends DiscreteDistribution {
    constructor(r, p) {
        super(...arguments);
        this.exp = r * p / (1 - p);
        this.variance = r * p / Math.pow((1 - p), 2);
        this.name = 'NBinomial';
        this.type = 'NB';

        this.r = r;
        this.p = p;
        this.q = 1 - p;

        this.min = 0;
        this.max = Infinity;
    }

    equals(k) {
        return Binomial.binomialCoefficient(k + this.r - 1, k) * Math.pow(this.q, this.r) * Math.pow(this.p, k);
    }
}