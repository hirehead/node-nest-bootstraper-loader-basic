/// <reference path="_ref.d.ts" />

class NestBootstraperLoaderBasic implements Nest.IBootstraperLoader {

    constructor(
        public registrator: Nest.IBootstraperRegistrator,
        public bootstraper: Nest.IBootstraper) {}

    reg(json: any): any {
        if (typeof json === 'array') {
            return ( < Array < any >> json).map((x, i, v) => {
                return this.reg(x);
            });
        } else if (typeof json === 'string') {
            var split: Array < string > = ( < string > json).split('&');
            var pckg = require(split[0]);
            if (split.length > 1)
                return pckg['step_' + split[1]];
            else if (typeof pckg === 'function' || typeof pckg === 'array')
                return pckg;
            else
                return pckg['step'];
        }

        throw 'incorrect formatting of the config';
    }

    register(json: Array < any > );
    register(json: string);
    register(json: any) {
        if (typeof json === 'string') {
            json = require(json);
            if (json) {
                if (json.nest && json.nest.bootstrap)
                    json = json.nest.bootstrap;
                else if (json.bootstrap)
                    json = json.bootstrap;
                else
                    this.register(json);
            }
        }

        if (typeof json !== 'array')
            throw 'incorrect formatting of the config';

        var reg = [];
        var tmp = [];
        for (var i = 0; i < json.length; ++i) {
            var x = json[i];
            if (x === 'start' || x === 'wait') {
                reg.push({
                    type: x,
                    reg: tmp
                });
                tmp = [];
            } else
                tmp.push(x);
        }

        if (tmp.length > 0)
            reg.push({
                type: 'start',
                reg: tmp
            });

        var r = (x: Array < any > ) => {
            if (this.registrator)
                this.registrator.register(this.reg(x));
            else
                this.bootstraper.register(this.reg(x));
        };

        var proc = (i: number) => {
            var p = reg[i];
            if (p) {
                if (p.type === 'start') {
                    r(p.reg);
                    this.bootstraper.start();
                    proc(i + 1);
                } else if (p.type === 'wait') {
                    r(p.reg);
                    this.bootstraper.wait(() => {
                        proc(i + 1);
                    })
                }
            }
        }

        proc(0);
    }
}

module.exports = NestBootstraperLoaderBasic;