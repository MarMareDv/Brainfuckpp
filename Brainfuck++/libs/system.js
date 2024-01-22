return {
    //Control Flow Library (Built-in)
    /*Implements all important functions*/

    expr: (expr)=>{
        if(expr.type != "string" || !['"',"'"].includes(expr.pack)){ this.err = "Invalid Expression"; return;}
        this.tempExp = expr.val;
        for(this.tempA of Object.keys(this.vars)){
            this.tempB = this.vars[this.tempA];
            this.tempExp = this.tempExp.replaceAll(`&${this.tempA}`,this.tempB.pos);
            this.tempExp = this.tempExp.replaceAll(`$${this.tempA}`,this.tempB.size);
        }
        return this.formula(this.tempExp);
    },

    read: (name)=>{
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "char"){ this.err = "Invalid Input Variable - Requires Char Type Variable"; return;}
        return this.inScope(`${",>".repeat(this.vars[name.val].size)}${"<".repeat(this.vars[name.val].size)}`,this.vars[name.val].pos);
    },

    print: (name)=>{
        if(!(name.type == "sym" && this.vars[name.val])&&!(name.type == "string" && ['"',"'"].includes(name.pack))){ this.err = "Invalid Print Value"; return;}
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

    mexec: (name)=>{
        if(name.type != "sym" || !this.macros[name.val]){ this.err = "Macro Not Defined or Invalid"; return;}
        return this.macros[name.val];
    },

    copyByte: (name, pos, bname, bpos)=>{
        return `${this.func.dmoveByte(name,pos,bname,bpos,{type:"sym",val:"acc"},{type:"string",val:"0",pack:"]"})}${this.func.moveByte({type:"sym",val:"acc"},{type:"string",val:"0",pack:"]"},name,pos)}`;
    },

    moveAddByte: (name, pos, bname, bpos)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(bname.type != "sym" || !this.vars[bname.val]){ this.err = "Variable Invalid"; return;}
        if(bpos.type != "string" || bpos.pack != "]" || isNaN(Number(bpos.val))){ this.err = "Invalid Byte Index"; return;}
        return `${this.procScope(this.inScope(`+`,this.vars[bname.val].pos+Number(bpos.val)),this.vars[name.val].pos+Number(pos.val))}`;
    },

    moveSubByte: (name, pos, bname, bpos)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(bname.type != "sym" || !this.vars[bname.val]){ this.err = "Variable Invalid"; return;}
        if(bpos.type != "string" || bpos.pack != "]" || isNaN(Number(bpos.val))){ this.err = "Invalid Byte Index"; return;}
        return `${this.procScope(this.inScope(`-`,this.vars[bname.val].pos+Number(bpos.val)),this.vars[name.val].pos+Number(pos.val))}`;
    },

    dmoveByte: (name, pos, bname, bpos, cname, cpos)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(bname.type != "sym" || !this.vars[bname.val]){ this.err = "Variable Invalid"; return;}
        if(bpos.type != "string" || bpos.pack != "]" || isNaN(Number(bpos.val))){ this.err = "Invalid Byte Index"; return;}
        if(cname.type != "sym" || !this.vars[cname.val]){ this.err = "Variable Invalid"; return;}
        if(cpos.type != "string" || cpos.pack != "]" || isNaN(Number(cpos.val))){ this.err = "Invalid Byte Index"; return;}
        return `${this.inScope(`[-]`,this.vars[bname.val].pos+Number(bpos.val))}${this.inScope(`[-]`,this.vars[bname.val].pos+Number(bpos.val))}${this.procScope(this.inScope(`+`,this.vars[bname.val].pos+Number(bpos.val))+this.inScope(`+`,this.vars[cname.val].pos+Number(cpos.val)),this.vars[name.val].pos+Number(pos.val))}`;
    },

    moveByte: (name, pos, bname, bpos)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        if(bname.type != "sym" || !this.vars[bname.val]){ this.err = "Variable Invalid"; return;}
        if(bpos.type != "string" || bpos.pack != "]" || isNaN(Number(bpos.val))){ this.err = "Invalid Byte Index"; return;}
        return `${this.inScope(`[-]`,this.vars[bname.val].pos+Number(bpos.val))}${this.inScope(`[-]`,this.vars[bname.val].pos+Number(bpos.val))}${this.procScope(this.inScope(`+`,this.vars[bname.val].pos+Number(bpos.val)),this.vars[name.val].pos+Number(pos.val))}`;
    },

    clearByte: (name, pos)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Byte Index"; return;}
        return this.inScope(`[-]`,this.vars[name.val].pos+Number(pos.val));
    },

    addByte: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val)) || (pos.val >= this.vars[name.val].size&&this.vars[name.val].type!="ref") || pos.val < 0){ this.err = "Invalid Byte Index"; return;}
        if(!["sym","number"].includes(val.type) || (val.type == "number" && (val.val < 0 || val.val > 255)) || (val.type == "sym" && this.enums[val.val] == null)){ this.err = `Invalid Byte Value '${val.val}'`; return;}
        return this.inScope(`${"+".repeat((isNaN(val.val)?this.enums[val.val]:val.val))}`,this.vars[name.val].pos+Number(pos.val));
    },

    subByte: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val)) || (pos.val >= this.vars[name.val].size&&this.vars[name.val].type!="ref") || pos.val < 0){ this.err = "Invalid Byte Index"; return;}
        if(!["sym","number"].includes(val.type) || (val.type == "number" && (val.val < 0 || val.val > 255)) || (val.type == "sym" && this.enums[val.val] == null)){ this.err = `Invalid Byte Value '${val.val}'`; return;}
        return this.inScope(`${"-".repeat((isNaN(val.val)?this.enums[val.val]:val.val))}`,this.vars[name.val].pos+Number(pos.val));
    },

    setByte: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val)) || (pos.val >= this.vars[name.val].size&&this.vars[name.val].type!="ref") || pos.val < 0){ this.err = "Invalid Byte Index"; return;}
        if(!["sym","number"].includes(val.type) || (val.type == "number" && (val.val < 0 || val.val > 255)) || (val.type == "sym" && this.enums[val.val] == null)){ this.err = `Invalid Byte Value '${val.val}'`; return;}
        return this.inScope(`[-]${"+".repeat((isNaN(val.val)?this.enums[val.val]:val.val))}`,this.vars[name.val].pos+Number(pos.val));
    },

    subChar: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Char Index"; return;}
        if(val.type != "string" || !['"',"'"].includes(val.pack) || val.val.length != 1 ){ this.err = "Invalid Char"; return;}
        return this.inScope(`${"-".repeat(val.val.charCodeAt(0))}`,this.vars[name.val].pos+Number(pos.val));
    },

    addChar: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Char Index"; return;}
        if(val.type != "string" || !['"',"'"].includes(val.pack) || val.val.length != 1 ){ this.err = "Invalid Char"; return;}
        return this.inScope(`${"+".repeat(val.val.charCodeAt(0))}`,this.vars[name.val].pos+Number(pos.val));
    },

    setChar: (name, pos, val)=>{
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;}
        if(pos.type != "string" || pos.pack != "]" || isNaN(Number(pos.val))){ this.err = "Invalid Char Index"; return;}
        if(val.type != "string" || !['"',"'"].includes(val.pack) || val.val.length != 1 ){ this.err = "Invalid Char"; return;}
        return this.inScope(`[-]${"+".repeat(val.val.charCodeAt(0))}`,this.vars[name.val].pos+Number(pos.val));
    },

    setString: (name, val)=>{
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "char"){ this.err = "Variable Invalid - Requires Char Type Variable"; return;}
        if(val.type != "string" || !['"',"'"].includes(val.pack) || val.val.length > this.vars[name.val].size){ this.err = "Invalid String"; return;}
        this.tempA = "";
        for(this.tempI=0;this.tempI<this.vars[name.val].size;this.tempI++){
            this.tempA += `[-]${"+".repeat(val.val.charCodeAt(this.tempI))}>`;
        }
        this.tempA += `<`.repeat(this.vars[name.val].size);

        return this.inScope(this.tempA,this.vars[name.val].pos);
    },

    call: (name)=>{
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "proc"){ this.err = "Process Variable Invalid"; return;}
        return this.inScope("+",this.vars[name.val].pos);
    },

    uncall: (name)=>{
        if(name.type != "sym" || !this.vars[name.val] || this.vars[name.val].type != "proc"){ this.err = "Process Variable Invalid"; return;}
        return this.inScope("[-]",this.vars[name.val].pos);
    },

    scope: (name)=>{
        //This Is Likely Extremely Broken, Unknown Activity Can Occur When In Use
        if(name.type != "sym" || !this.vars[name.val]){ this.err = "Variable Invalid"; return;};
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