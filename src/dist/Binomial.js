import * as math from 'mathjs';

import DiscreteDistribution from './DiscreteDistribution';

export default class Binomial extends DiscreteDistribution {
    constructor(n, p) {
        super(...arguments);
        this.exp = n * p;
        this.variance = n * p * (1 - p);
        this.name = 'Binomial';
        this.type = 'B';

        this.n = n;
        this.p = p;
        this.q = 1 - p;

        this.min = 0;
        this.max = n;
    }

    equals(k) {
        return math.pow(this.p, k) * math.pow(this.q, this.n - k) * Binomial.binomialCoefficient(this.n, k);
    }

    static binomialCoefficient(n, k) {
        return math.factorial(n) / (math.factorial(n - k) * math.factorial(k));
    }
}