import Normal from "./Normal";
import Poisson from "./Poisson";
import Binomial from "./Binomial";
import NBinomial from "./NBinomial";
import Geometric from "./Geometric";

export function parseVariable(text) {
    const ref = {
        "N": Normal,
        "Po": Poisson,
        "B": Binomial,
        "NB": NBinomial,
        "Geo": Geometric
    };
    let params, distribution;

    try {
        params = text.split("(")[1].split(")")[0].split(",").map(function (elem) {
            return parseFloat(elem);
        }); // with readability in mind :)
        distribution = text.split("(")[0];
    } catch (e) {
        // not a standard distribution
        // assume it's a PDF
        return text;
    }
    params.unshift(null);
    return typeof ref[distribution] === "undefined" ? text : (new (Function.prototype.bind.apply(ref[distribution], params)));
}