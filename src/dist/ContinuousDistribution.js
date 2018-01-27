import Distribution from './Distribution';

export default class ContinuousDistribution extends Distribution {
    pdfFormula;
    min;
    max;

    constructor(...args) {
        super(...args);
        this.isDiscrete = false;
    }

    lessThan(k) {
        return this.between(this.min, k);
    }

    greaterThan(k) {
        return 1 - this.lessThan(k);
    }

    between(a, b) {

    }

    pdf(x) {

    }
}