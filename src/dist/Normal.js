import ContinuousDistribution from './ContinuousDistribution';

export default class Normal extends ContinuousDistribution {
    constructor(mu, sigma2) {
        super(...arguments);
        this.exp = mu;
        this.variance = sigma2;
        this.name = 'Normal';
        this.type = 'N';

        this.pdfFormula = "1/(" + Math.sqrt(this.variance) + "*sqrt(2*pi)) * exp(-(x-" + this.exp + ")^2/(2*" + this.variance + "))";

        this.min = -Infinity;
        this.max = Infinity;
    }

    between(a, b) {
        if (a >= b) {
            return 0;
        } else {
            const normalise = x => (x - this.exp) / Math.sqrt(this.variance);

            return Normal._Phi(normalise(b)) - Normal._Phi(normalise(a));
        }
    }

    pdf(x) {
        return 1 / (Math.sqrt(2 * Math.PI * this.variance)) * Math.exp(-Math.pow((x - this.exp), 2) / (2 * this.variance));
    }

    static _Phi(x) {
        return (1 + Normal.erf(x / Math.sqrt(2))) / 2;
    }

    static sgn(x) {
        return x === 0 ? 0 : x / Math.abs(x);
    }

    static erf(x) {
        if (x === -Infinity) {
            return -1;
        } else if (x === Infinity) {
            return 1;
        } else {
            const pi = Math.PI,
                c = [31 / 200, 341 / 8000];
            return 2 / Math.sqrt(pi) * Normal.sgn(x) * Math.sqrt(1 - Math.exp(-x * x)) * (Math.sqrt(pi) / 2 + c[0] * Math.exp(-x * x) - c[1] * Math.exp(-2 * x * x)); // like a pro
        }
    }

    // for later maybe
    static erfinv(x) {
        // Algorithm shamelessly stolen from some file I found on the internet
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
            ret = Normal.sgn(x) * (p[0] / t + p[1] + t * (p[2] + t * (p[3] + t * (p[4] + t * p[5])))) / (q[0] + t * (q[1] + t * (q[2])));
        } else {
            ret = MAXDUB;
        }

        return ret;
    }
}