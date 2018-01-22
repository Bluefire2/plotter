/*
 * I'll add more to this soon
 * ******************
 * Distributions supported:
 ** Normal
 ** Poisson
 ** Binomial
 ** Negative Binomial
 ** Geometric
 * ******************
 * Methods supported:
 ** E(): returns the expected value of the distribution.
 ** Var(): returns the variance of the distribution.
 ** moreThan(x): returns the probability of the variable being greater than `x` (strong).
 ** lessThan(x): returns the probability of the variable being less than `x` (strong).
 ** between(x, y): returns the probability of the variable being between `x` and `y` (weak).
 ** equalTo(x): returns the probability of the variable being equal to `x`. Only available for discrete distributons.
 ** equalTo(x, cont): same as the above but with a continuity correction, essentially calling between(`x` - `cont`, `x` + `cont`). Default value of `cont` is 0.5. Only available for continuous distributons.
 ** toArray(min, max): outputs an array of the distribution's values from `min` to `max`. For continuous distributions, this uses increments of 1 and a continuity correction of +-0.5.
 ** toArray(max): outputs an array of the distribution's values from 0 to `max`. Shorthand for toArray(0, `max`).
 ** approximate(type): experimental, may be buggy. Returns another distribution to approximate the current one, with its type specified by `type`. For example, X~B(n, p) can be approximated by Y~N(np, np(1-p)). Only available for discrete distributions.
 */

import * as math from 'mathjs';

const factorials = [1, 1]; // caching results to avoid calculating the same value twice
let factorial;
if (typeof math === "undefined") {
    factorial = function (n) {
        if (typeof factorials[n] === "undefined") {
            if (n === 0 || n === 1) {
                return 1;
            } else {
                factorials[n] = n * factorial(n - 1);
            }
        }
        return factorials[n];
    };
} else {
    factorial = math.factorial;
}

function isIntegral(n) {
    return (Math.round(n) === n);
}

export function Normal(m, s2, CC) {
    const cont = !(typeof CC === "undefined" && !CC); // so technically to include a continuity correction you can just use any value for CC
    // no way that could go wrong, huh
    const mean = m,
        variance = s2,
        dev = Math.sqrt(s2);

    this.isDiscrete = false;
    this.data = function () {
        return [mean, variance];
    };

    function sgn(x) {
        return x === 0 ? 0 : x / Math.abs(x);
    }

    function erf(x) {
        const pi = Math.PI,
            c = [31 / 200, 341 / 8000];
        return 2 / Math.sqrt(pi) * sgn(x) * Math.sqrt(1 - Math.exp(-x * x)) * (Math.sqrt(pi) / 2 + c[0] * Math.exp(-x * x) - c[1] * Math.exp(-2 * x * x)); // like a pro
    }

    function erfinv(x) {
        // Algorithm stolen from some file I found on the internet
        // See erfinv.c in this directory for the original code
        const MAXDUB = Infinity,
            ax = Math.abs(x);
        let t,
            ret;

        if (ax <= 0.75) {
            const p = [-13.0959967422, 26.785225760, -9.289057635],
                q = [-12.0749426297, 30.960614529, -17.149977991, 1];
            t = x * x - 0.75 * 0.75;
            ret = x * (p[0] + t * (p[1] + t * p[2])) / (q[0] + t * (q[1] + t * (q[2] + t * q[3])));
        } else if (ax >= 0.75 && ax <= 0.9375) {
            const p = [-0.12402565221, 1.0688059574, -1.9594556078, 0.4230581357],
                q = [-0.08827697997, 0.8900743359, -2.1757031196, 1];
            t = x * x - 0.9375 * 0.9375;
            ret = x * (p[0] + t * (p[1] + t * (p[2] + t * p[3]))) / (q[0] + t * (q[1] + t * (q[2] + t * q[3])));
        } else if (ax >= 0.9375 && ax <= (1.0 - 1.0e-100)) {
            const p = [.1550470003116, 1.382719649631, 0.690969348887, -1.128081391617, 0.680544246825, -0.16444156791],
                q = [0.155024849822, 1.385228141995, 1];
            t = 1 / Math.sqrt(-Math.log(1 - ax));
            ret = sgn(x) * (p[0] / t + p[1] + t * (p[2] + t * (p[3] + t * (p[4] + t * p[5])))) / (q[0] + t * (q[1] + t * (q[2])));
        } else {
            ret = MAXDUB;
        }

        return ret;
    }

    function _Phi(x) {
        return (1 + erf(x / Math.sqrt(2))) / 2;
    }

    this.E = function () {
        return mean;
    };
    this.Var = function () {
        return variance;
    };
    this.Phi = function (x) { // it's a duplicate but keeping it for now, while I deprecate it
        return _Phi(x);
    };
    this.PDF = function (x) {
        return 1 / ( Math.sqrt(variance) * Math.sqrt(2 * Math.PI)) * Math.exp(-(Math.pow(x - mean, 2)) / (2 * variance));
    };
    this.CDF = function (x) {
        return _Phi((x - mean) / dev);
    };
    this.CDFinv = function (x) {
        return mean - dev * Math.sqrt(2) * erfinv(1 - 2 * x);
    };
    this.moreThan = function (b) {
        if (cont) {
            b = Math.round(b) + 0.5;
        }
        return b <= mean ? _Phi(b) : 1 - _Phi(b);
    };
    this.lessThan = function (b) {
        if (cont) {
            b = Math.round(b) - 0.5;
        }
        return b >= mean ? _Phi(b) : 1 - _Phi(b);
    };
    this.between = function (a, b) {
        if (a > b) { // swap a and b if a is bigger, without loss of generality
            const t = a;
            a = b;
            b = t;
        }
        return this.moreThan(b) + this.lessThan(a) - 1;
    };
    this.equalTo = function (a, cont) {
        cont = typeof cont === "undefined" ? 0.5 : cont;
        return this.between(a + cont, a - cont)
    };
    this.toArray = function (min, max) {
        min = typeof max === "undefined" ? 0 : min;
        const out = [];
        for (let i = min; i <= max; i++) {
            out[i] = this.equalTo(i);
        }
        return out;
    };
    this.type = "N";
    this.name = "Normal";
}

export function Poisson(p) {
    const lambda = p,
        lexp = Math.exp(-lambda);

    this.isDiscrete = true;
    this.data = function () {
        return [lambda];
    };
    this.E = function () {
        return lambda;
    };
    this.Var = function () {
        return lambda;
    };
    this.equal = function (a) {
        return isIntegral(a) && a >= 0 ? lexp * Math.pow(lambda, a) / factorial(a) : 0;
    };
    this.between = function (a, b) {
        if (!isIntegral(a) || !isIntegral(b)) {
            return 0;
        } else {
            if (a > b) { // swap a and b if a is bigger, without loss of generality
                const t = a;
                a = b;
                b = t;
            }
            let sum = 0;
            for (let i = a; i <= b; i++) {
                sum += Math.pow(lambda, i) / factorial(i);
            }
            return sum * lexp;
        }
    };
    this.lessThan = function (b) {
        return this.between(0, b - 1);
    };
    this.moreThan = function (b) {
        return 1 - this.between(0, b);
    };
    this.toArray = function (lower, upper) {
        lower = typeof upper === "undefined" ? 0 : lower;
        const out = [];
        for (let i = lower; i <= upper; i++) {
            out[i] = this.equal(i);
        }
        return out;
    };
    this.type = "Po";
    this.name = "Poisson";
}

export function Binomial(n, p) {
    const amt = n,
        prob = p,
        q = 1 - p,
        _E = n * p,
        _Var = n * p * q,
        _data = [amt, prob],
        nfact = factorial(n);
    if (p > 1) {
        return false;
    }

    this.isDiscrete = true;
    this.data = function () {
        return _data;
    };
    this.E = function () {
        return _E;
    };
    this.Var = function () {
        return _Var;
    };

    this.equal = function (x) {
        if (x > amt || x < 0 || !isIntegral(x)) {
            return 0;
        } else {
            const cf = nfact / (factorial(x) * factorial(amt - x));
            return cf * Math.pow(prob, x) * Math.pow(q, amt - x);
        }
    };
    this.between = function (a, b) {
        if (a > amt || b > amt || !isIntegral(a) || !isIntegral(b)) {
            return 0;
        } else {
            if (a > b) { // swap a and b if a is bigger, without loss of generality
                const t = a;
                a = b;
                b = t;
            }
            let sum = 0;
            for (let i = a; i <= b; i++) {
                sum += this.equal(i);
            }
            return sum;
        }
    };
    this.moreThan = function (x) {
        return this.between(x, amt);
    };
    this.lessThan = function (x) {
        return this.between(0, x);
    };
    this.approximate = function (type) {
        switch (type) {
            case "N":
                return new Normal(_E, _Var, true);
            case "Po":
                return new Poisson(_E);
            default:
                return false;
        }
    };
    this.toArray = function (lower, upper) {
        lower = typeof upper === "undefined" ? 0 : lower;
        const out = [];
        for (let i = lower; i <= upper; i++) {
            out[i] = this.equal(i);
        }
        return out;
    };
    this.type = "B";
    this.name = "Binomial";
}

export function NBinomial(r, p) {
    const fail = r,
        prob = p,
        q = 1 - p,
        _E = fail * prob / (1 - prob),
        _Var = _E / (1 - prob),
        _data = [fail, prob];
    if (p > 1) {
        return false;
    }

    this.isDiscrete = true;
    this.data = function () {
        return _data;
    };
    this.E = function () {
        return _E;
    };
    this.Var = function () {
        return _Var;
    };

    this.equal = function (x) {
        if (x < 0 || !isIntegral(x)) {
            return 0;
        } else {
            const cf = factorial(fail + x - 1) / (factorial(fail - 1) * factorial(x));
            return cf * Math.pow(prob, x) * Math.pow(q, fail);
        }
    };
    this.between = function (a, b) {
        if (!isIntegral(a) || !isIntegral(b)) {
            return 0;
        } else {
            if (a > b) { // swap a and b if a is bigger, without loss of generality
                const t = a;
                a = b;
                b = t;
            }
            let sum = 0;
            for (let i = a; i <= b; i++) {
                sum += this.equal(i);
            }
            return sum;
        }
    };
    this.moreThan = function (x) {
        return 1 - this.lessThan(x - 1);
    };
    this.lessThan = function (x) {
        return this.between(0, x);
    };
    this.toArray = function (lower, upper) {
        lower = typeof upper === "undefined" ? 0 : lower;
        const out = [];
        for (let i = lower; i <= upper; i++) {
            out[i] = this.equal(i);
        }
        return out;
    };
    this.type = "NB";
    this.name = "Negative Binomial";
}

export function Geometric(p) { // a special case of the Negative Binomial distribution
    return new NBinomial(1, 1 - p);
}