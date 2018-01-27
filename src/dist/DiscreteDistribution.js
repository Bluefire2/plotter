import * as _ from 'lodash';

import Distribution from './Distribution';

export default class DiscreteDistribution extends Distribution {
    min;
    max;

    constructor(...args) {
        super(...args);
        this.isDiscrete = true;
    }

    lessThan(k) {
        return this.between(this.min, k - 1);
    }

    greaterThan(k) {
        return 1 - this.lessThan(k + 1);
    }

    between(a, b) {
        if (a > b) {
            return 0;
        } else {
            return this.toArray(a, b).reduce((acc, curr) => acc + curr);
        }
    }

    toArray(a, b) {
        return _.range(a, b + 1).map(this.equals.bind(this));
    }

    equals(k) {

    }
}