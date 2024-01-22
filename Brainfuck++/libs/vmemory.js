return {
    //VMemory Library (Built-in)
    /*Implements More Memory Datatypes And Features*/

    _startup: (sys)=>{
        sys.types.vcell = {form: "std", sOff: 2, sFac:0};
        sys.types.vtape_acc = {form: "std", sOff: 1, sFac:0};
        sys.types.vtape = {form: "struct", body:[
            {name: "Prototype", size: 1, type: "vtape_acc"},
            {name: "constructor", type: "", val: new ValueTree({})},
            {name: "start", size: 1, type: "byte"},
            {name: "cells", size: "*", type: "vcell"},
            {name: "end", size: 1, type: "vcell"}
        ]};
    },

    'vtape.right': (name, val)=>{
        //Moves Vtape
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        if(val.type != "number"){ this.err = "Tape Move Invalid"; return;}
        return this.inScope(`>>[>>]+${">>+".repeat((val.val??1)-1)}${"<<".repeat((val.val??1)-1)}<<[<<]`,this.vars[name.val].pos+1);
    },

    'vtape.left': (name, val)=>{
        //Moves Vtape
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        if(val.type != "number"){ this.err = "Tape Move Invalid"; return;}
        return this.inScope(`>>[>>]-${"<<-".repeat((val.val??1)-1)}${"<<".repeat((val.val??1)-1)}<<[<<]`,this.vars[name.val].pos+1);
    },

    'vtape.point': (name)=>{
        //Moves Vtape By Accumulator
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`[->>>[>>]+<<[<<]<]`,this.vars[name.val].pos);
    },

    'vtape.home': (name)=>{
        //Moves Vtape To Start
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`>>[>>]<<[[-]<<]`,this.vars[name.val].pos+1);
    },

    'vtape.print': (name)=>{
        //Moves Accumulator To Pointed Cell
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`>>[>>]<.><<[<<]`,this.vars[name.val].pos+1);
    },

    'vtape.write': (name)=>{
        //Moves Accumulator To Pointed Cell
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`>>>[>>]<[-]><<[<<]<[->>>[>>]<+><<[<<]<]`,this.vars[name.val].pos);
    },

    'vtape.writeAdd': (name)=>{
        //Moves Accumulator To Pointed Cell
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`[->>>[>>]<+><<[<<]<]`,this.vars[name.val].pos);
    },

    'vtape.get': (name)=>{
        //Moves Pointed Cell To Accumulator
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`<[-]>>>[>>]<[-><<[<<]<+>>>[>>]<]><<[<<]`,this.vars[name.val].pos+1);
    },

    'vtape.getAdd': (name)=>{
        //Moves Pointed Cell To Accumulator
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`>>[>>]<[-><<[<<]<+>>>[>>]<]><<[<<]`,this.vars[name.val].pos+1);
    },

    'vtape.clear': (name)=>{
        //Clears Pointed Cell
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "vtape_acc"){ this.err = "Tape Variable Invalid"; return;}
        return this.inScope(`>>[>>]<[-]><<[<<]`,this.vars[name.val].pos);
    },
}