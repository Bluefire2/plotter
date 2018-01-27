import * as math from 'mathjs';

import DiscreteDistribution from './DiscreteDistribution';

export default class Poisson extends DiscreteDistribution {
    constructor(lambda) {
        super(...arguments);
        this.exp = lambda;
        this.variance = lambda;
        this.name = 'Poisson';
        this.type = 'Po';

        this.lambda = lambda;

        this.min = 0;
        this.max = Infinity;
    }

    equals(k) {
        return math.pow(this.lambda, k) * math.exp(-this.lambda) / math.factorial(k);
    }
}