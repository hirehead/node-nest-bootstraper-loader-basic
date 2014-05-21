/// <reference path="_ref.d.ts" />

export class NestBootstraperLoaderBasic implements Nest.IBootstraperLoader {

    constructor(
        public require: (path: string) => any,
        public registrator: Nest.IBootstraperRegistrator,
        public bootstraper: Nest.IBootstraper) {}

    reg(json: any): any {
        if (json instanceof Array) {
            return ( < Array < any >> json).map((x, i, v) => {
                return this.reg(x);
            });
        } else if (typeof json === 'string') {
            var split: Array < string > = ( < string > json).split('&');
            var pckg = this.require(split[0]);
            if (split.length > 1)
                return pckg['step_' + split[1]];
            else if (typeof pckg === 'function' || pckg instanceof Array)
                return pckg;
            else
                return pckg['step'];
        }

        throw 'incorrect formatting of the config';
    }

    register(json: Array < any > );
    register(json ? : string);
    register(json ? : any) {
        if (json === undefined || typeof json === 'string') {
            if (json === undefined)
                json = './package.json';
            json = this.require(json);
            if (json) {
                if (json.nest && json.nest.bootstrap)
                    json = json.nest.bootstrap;
                else if (json.bootstrap)
                    json = json.bootstrap;
                else
                    this.register(json);
            }
        }

        if (!(json instanceof Array))
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

        var registr = this.registrator || this.bootstraper;

        var r = (x: Array < any > ) => {
            var toRegister = this.reg(x);
            for (var i = 0; i < toRegister.length; ++i)
                registr.register(toRegister[i]);
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