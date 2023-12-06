return {
    _startup: (sys)=>{
        sys.types.bool = {form: "std", sOff: 2, sFac:0}
    },

    setBool: (name,val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!(val.type == "number") || (val.val == 0 && val.val == 1) ){ this.err = "Invalid Bool Value 0-1"; return;}
        return this.inScope(`[-]${(val.val==1?"+":"")}`,this.vars[name.val].pos);
    },

    if: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val] || !(this.vars[name.val].type == "bool")){ this.err = "Variable Invalid - Requires Bool"; return;}
        this.scopes.push(this.inScope("[",this.vars[name.val].pos));
        return this.scopes.push(this.inScope("[-]]",this.vars[name.val].pos));
    },
}