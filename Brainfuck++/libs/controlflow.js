return {
    //Control Flow Library (Built-in)
    /*Implements Booleans and Conditional Statements*/

    _startup: (sys)=>{
        sys.enums.true = 1;
        sys.enums.false = 0;
        sys.types.bool = {form: "std", sOff: 2, sFac:0};
    },
    
    repeat: (name, pos, times)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(!times.type == "number" || (times.val > -1 && times.val < 256) ){ this.err = "Loop Times Invalid"; return;}
        this.scopes.push(this.inScope(`-]`,this.vars[name.val].pos));
        return this.inScope(`[`,this.vars[name.val].pos);
    },

    byteToBool: (name, pos, bname)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(!bname.type == "sym" || !this.vars[bname.val] || this.vars[bname.val].type != "bool"){ this.err = "Variable Invalid"; return;}
        return this.whileScope(`${this.inScope("+",this.vars[bname.val].pos)}`,this.vars[name.val].pos+Number(pos.val),"[-]");
    },

    setBool: (name,val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!(val.type == "number") || (val.val == 0 && val.val == 1) ){ this.err = "Invalid Bool Value 0-1"; return;}
        return this.inScope(`[-]${(val.val==1?"+":"")}`,this.vars[name.val].pos);
    },

    notBool: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        return this.inScope(`>+<[>-<[-]]>[-<+>]<`,this.vars[name.val].pos);
    },

    if: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val] || !(this.vars[name.val].type == "bool")){ this.err = "Variable Invalid - Requires Bool"; return;}
        this.scopes.push(this.inScope(`[-]]`,this.vars[name.val].pos));
        return this.inScope(`[`,this.vars[name.val].pos);
    },

    for: (name, pos)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        this.scopes.push(this.inScope(`-]`,this.vars[name.val].pos+Number(pos.val)));
        return this.inScope(`[`,this.vars[name.val].pos+Number(pos.val));
    },

    while: (name, pos)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        this.scopes.push(this.inScope(`]`,this.vars[name.val].pos+Number(pos.val)));
        return this.inScope(`[`,this.vars[name.val].pos+Number(pos.val));
    },
}