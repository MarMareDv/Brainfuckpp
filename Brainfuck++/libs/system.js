return {

    '#': ()=>{
        //Comment
        return '';
    },

    expr: (expr)=>{
        if(!expr.type == "string" || !['"',"'"].includes(expr.pack)){ this.err = "Invalid Expression"; return;}
        this.tempExp = expr.val;
        for(this.tempA of Object.keys(this.vars)){
            this.tempB = this.vars[this.tempA];
            this.tempExp = this.tempExp.replaceAll(`&${this.tempA}`,this.tempB.pos);
            this.tempExp = this.tempExp.replaceAll(`$${this.tempA}`,this.tempB.size);
        }
        return this.formula(this.tempExp);
    },

    print: (name)=>{
        if(!(name.type == "sym" && this.vars[name.val])&&!(name.type == "string" && ['"',"'"].includes(name.pack))){ this.err = "Invalid Input"; return;}
        if(name.type == "string"){
            var tempStr = "";
            for(var tempChar of name.val.split('')){
                tempStr += `${"+".repeat(tempChar.charCodeAt(0))}.[-]`;
            }
            return this.inScope(tempStr,this.vars.acc.pos);
        }else if(name.type == "sym"){
            return this.inScope(`${".>".repeat(this.vars[name.val].size)}${"<".repeat(this.vars[name.val].size)}`,this.vars[name.val].pos);
        }
    },

    addByte: (name, pos, val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(pos.val)){ this.err = "Invalid Byte Index"; return;}
        if(!val.type == "number" || val.val < 0 || val.val > 255){ this.err = "Invalid Byte Value 0-255"; return;}
        return this.inScope(`${"+".repeat(val.val)}`,this.vars[name.val].pos);
    },

    subByte: (name, pos, val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(pos.val)){ this.err = "Invalid Byte Index"; return;}
        if(!val.type == "number" || val.val < 0 || val.val > 255){ this.err = "Invalid Byte Value 0-255"; return;}
        return this.inScope(`${"-".repeat(val.val)}`,this.vars[name.val].pos);
    },

    setByte: (name, pos, val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(pos.val)){ this.err = "Invalid Byte Index"; return;}
        if(!val.type == "number" || val.val < 0 || val.val > 255){ this.err = "Invalid Byte Value 0-255"; return;}
        return this.inScope(`[-]${"+".repeat(val.val)}`,this.vars[name.val].pos);
    },

    setChar: (name, pos, val)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(!pos.type == "string" || !pos.pack == "]" || isNaN(Number(pos.val))){ this.err = "Invalid Char Index"; return;}
        if(!val.type == "string" || !['"',"'"].includes(val.pack) || val.val.length != 1 ){ this.err = "Invalid Char"; return;}
        return this.inScope(`[-]${"+".repeat(val.val.charCodeAt(0))}`,this.vars[name.val].pos);
    },

    call: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val] || this.vars[name.val].type != "proc"){ this.err = "Process Variable Invalid"; return;}
        return this.inScope("+",this.vars[name.val].pos);
    },

    uncall: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val] || this.vars[name.val].type != "proc"){ this.err = "Process Variable Invalid"; return;}
        return this.inScope("[-]",this.vars[name.val].pos);
    },

    scope: (name)=>{
        if(!name.type == "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;};
        moveTape(moveTape(this.vars[name.val].pos))
        this.scope.push(moveTape(this.vars.acc.pos));
        return moveTape(this.vars[name.val].pos);
    },

    _rawOps: {
        end: ()=>{
            if(this.scopes.length < 1) this.err = "Unmatched End Statement";
            return this.scopes.pop();
        },
    },
};