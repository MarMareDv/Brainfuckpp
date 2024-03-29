const Brainfuckpp = new class {
    async compile(data){
        this.memPos = 0;
        this.vars = {
            ProcLoop: {pos: -1, size: 1, type: 'proc'}
        };

        this.macros = {};
        this.enums = {};
        this.func = {};
        this.classtypes = {};
        this.types = {
            proc: {form: "std", sOff:1, sFac: 0},
            byte: {form: "std", sOff:0, sFac: 1},
            char: {form: "std", sOff:0, sFac: 1},
            ref: {form: "std", sOff:0, sFac: 0},
            void: {form: "std", sOff:0, sFac: 0}
        };
        this.tapePos = 0;
        this.data = data ?? {};
        this.error = "";
        this.rawOps = {};
        this.scopes = [];
        if(this.data.src){
            return await this._compile(await (await fetch(this.data.src)).text());
        }else if(this.data.code){
            return await this._compile(this.data.code);
        }else {
            return "Compile Error: Compile Data Not Valid";
        }
    }

    async _compile(code){
        this.prgstack = [];
        this.code = "";
        this.pcode = "";
        this.predefcode = "";
        this.lexRules = {
            '"':["string",'"'],
            "'":["string","'"],
            ' ':["break",''],
            '\n':["break",''],
            '\t':["break",''],
            '\r':["break",''],
            '{':["delim",'}',true],
            '}':["delim",'',true],
            '(':["delim",')',true],
            ')':["delim",'',true],
            '[':["string",']'],
            '<':["delim",'',true],
            '>':["delim",'',true],
            ',':["break",''],
            ':':["delim",'',true],
            '=':["delim",'',true],
            '+':["delim",'',true],
            '-':["delim",'',true],
            '*':["delim",'',true],
            ';':["delim",'',true],
            '|':["comment",'|'],
        };
        this.ast = _BrainfuckppLexer(code,this.lexRules);
        this.ast.CoerceNum();
        console.log(this.ast);
        this.alloc("acc","byte",2);

        for(this.i = 0; this.i < this.ast.rawtree.length; this.i++){
            this.vars.RAM = {pos: this.memPos,size: 0,type: "ref"}
            try {
                this.j = this.ast.rawtree[this.i];
                if(this.ast.rawtree[this.i].type == "delim"&&this.ast.rawtree[this.i].val == ";"){
                    //Pop Program Stack
                    if(!this.prgstack.pop()){ this.err="Program Stack Pop Failure"; }
                }else if(this.j.type == "delim"&&this.j.val == "="){
                    //Variable Definition
                    switch(this.ast.rawtree[this.i+1].type){
                        case("sym"):
                            this.predefcode += this.func.setByte.apply(this,[this.prgstack[this.prgstack.length-1],{type:"string",val: 0,pack:"]"},this.ast.rawtree[this.i+1]])
                            this.i+=1;
                            break;
                        case("string"):
                            this.predefcode += this.func.setString.apply(this,[this.prgstack[this.prgstack.length-1],this.ast.rawtree[this.i+1]])
                            this.i+=1;
                            break;
                        case("number"):
                            this.predefcode += this.func.setByte.apply(this,[this.prgstack[this.prgstack.length-1],{type:"string",val: 0,pack:"]"},this.ast.rawtree[this.i+1]])
                            this.i+=1;
                            break;
                        case("object"):
                            if(this.ast.rawtree[this.i+1].pack=="()"){
                                let tempI = 0;
                                for(tempI in this.ast.rawtree[this.i+1].val.rawtree){
                                    this.predefcode += this.func.setByte.apply(this,[this.prgstack[this.prgstack.length-1],{type:"string",val: tempI,pack:"]"},this.ast.rawtree[this.i+1].val.rawtree[tempI]])
                                    if(this.err){ break; }
                                }
                            }else {
                                this.err = `Object Definition Type Denied Enclosure '${this.ast.rawtree[this.i+1].pack}'`;
                            }
                            this.i+=1;
                            break;
                        default:
                            this.err=`Cannot Set "${this.ast.rawtree[this.i+1].type}"`
                            break;
                    }
                    if(this.err){this.err=`Variable Definition Error : ${this.err}`}
                }else if(this.ast.rawtree[this.i].type == "sym"){
                    //Basic Preprocessed Operations
                    switch(this.ast.rawtree[this.i].val){
                        case("enum"):
                            if(this.ast.rawtree[this.i+1].type != "sym"){ this.err="Invalid Enum Name"; break; }
                            if(this.ast.rawtree[this.i+2].type != "object" || this.ast.rawtree[this.i+2].pack != "{}"){ this.err="Type Definition Enclosure Not Found"; break; }
                            this.defineEnum(this.ast.rawtree[this.i+1].val,this.ast.rawtree[this.i+2].val);
                            this.i += 2;
                            break;

                        case("#section"):
                            if(this.ast.rawtree[this.i+1].type != "sym"){ this.err="Invalid Section Name"; break; }
                            switch(this.ast.rawtree[this.i+1].val){
                                case("preproc"):
                                    this.pcode += this.code;
                                    break;

                                default:
                                    this.err = "Invalid Section Type";
                                    break;
                            }
                            this.code = "";
                            this.i += 1;
                            break;

                        case("typedef"):
                            //Creates a Type Def
                            if(this.ast.rawtree[this.i+1].type != "sym"){ this.err="Invalid Type Name"; break; }
                            if(this.ast.rawtree[this.i+2].type != "object" || this.ast.rawtree[this.i+2].pack != "()"){ this.err="Type Definition Enclosure Not Found"; break; }
                            if(this.ast.rawtree[this.i+2].val.rawtree.length != 2 || this.ast.rawtree[this.i+2].val.rawtree[0].type != "number" || this.ast.rawtree[this.i+2].val.rawtree[1].type != "number"){ this.err="Invalid Object Arguments"; break; }
                            this.types[this.ast.rawtree[this.i+1].val] = {form: "std", sOff: this.ast.rawtree[this.i+2].val.rawtree[0].val, sFac: this.ast.rawtree[this.i+2].val.rawtree[1].val};
                            this.i += 2;
                            break;

                        case("struct"):
                            //Creates a Struct
                            if(this.ast.rawtree[this.i+1].type != "sym"){ this.err="Invalid Struct Name"; break; }
                            if(this.ast.rawtree[this.i+2].type != "object" || this.ast.rawtree[this.i+2].pack != "{}"){ this.err="Type Definition Enclosure Not Found"; break; }
                            this.defineStruct(this.ast.rawtree[this.i+1].val,this.ast.rawtree[this.i+2].val.rawtree);
                            this.i += 2;
                            break;

                        case("#use"):
                            //Imports Code from a File
                            if(this.ast.rawtree[this.i+1].type != "sym" && !(this.ast.rawtree[this.i+1].type == "string" && ["'",'"'].includes(this.ast.rawtree[this.i+1].pack))){ this.err="Invalid File Path In Includes"; break; }
                            let icode = _BrainfuckppLexer(await (await fetch(this.ast.rawtree[this.i+1].val)).text(),this.lexRules);
                            icode.CoerceNum();
                            this.ast.rawtree.splice(this.i, 2);
                            let toki;
                            for(toki of icode.rawtree.reverse()){
                                this.ast.rawtree.splice(this.i, 0, toki);
                            }
                            this.i -= 1;
                            break;
                        
                        case("#includes"):
                            //Imports Functions from a File
                            if(this.ast.rawtree[this.i+1].type != "sym" && !(this.ast.rawtree[this.i+1].type == "string" && ["'",'"'].includes(this.ast.rawtree[this.i+1].pack))){ this.err="Invalid File Path In Includes"; break; }
                            Object.assign(this.func,eval(`()=>{${await (await fetch(this.ast.rawtree[this.i+1].val)).text()}}`)());
                            if(this.func._startup){
                                this.func._startup(this);
                                this.func._startup = undefined;
                            }
                            this.func._rawOps = this.func._rawOps ?? {};
                            for(this.tempA of Object.keys(this.func._rawOps)){
                                this.tempB = this.func._rawOps[this.tempA];
                                this.rawOps[this.tempA] = this.tempB;
                            }
                            this.func._rawOps = undefined;
                            this.i += 1;
                            break;

                        case("var"):
                            //Variable Declaration
                            if(!this.ast.rawtree[this.i+1].type == "sym" || !this.CheckToken(this.ast.rawtree[this.i+2],"delim",":")){ this.err="Invalid Variable Definition"; break; }
                            this.prgstack.push(this.ast.rawtree[this.i+1]);
                            if(this.ast.rawtree[this.i+4].type == "string"&&this.ast.rawtree[this.i+4].pack == "]"){
                                this.alloc(this.ast.rawtree[this.i+1].val,this.ast.rawtree[this.i+3].val,Number(this.ast.rawtree[this.i+4].val));
                                this.i += 4;
                            }else {
                                this.alloc(this.ast.rawtree[this.i+1].val,this.ast.rawtree[this.i+3].val,1);
                                this.i += 3;
                            }
                            break;

                        case("macro"):
                            //Macro Definition
                            if(!(this.ast.rawtree[this.i+1].type == "sym") || !(this.ast.rawtree[this.i+2].type == "object") || !(this.ast.rawtree[this.i+2].pack == "{}")){ this.err="Invalid Macro Definition"; break; }
                            this.macros[this.ast.rawtree[this.i+1].val] = this._parseBlock(this.ast.rawtree[this.i+2].val);
                            this.i += 2;
                            break;

                        case("mexec"):
                            //Execute Macro
                            if(this.ast.rawtree[this.i+1].type != "sym" || !this.macros[this.ast.rawtree[this.i+1].val]){ this.err="Macro Call Not Defined or Invalid"; break; }
                            this.code += this.macros[this.ast.rawtree[this.i+1].val];
                            this.i += 1;
                            break;

                        case("alias"):
                            //Turn Macro Into Func
                            if(this.ast.rawtree[this.i+1].type != "sym" || this.func[this.ast.rawtree[this.i+1].val]){ this.err="Alias Name Invalid or Already Defined"; break; }
                            if(this.ast.rawtree[this.i+2].type != "delim" || this.ast.rawtree[this.i+2].val != "="){ this.err="Invalid Alias Allocator"; break; }
                            if(this.ast.rawtree[this.i+3].type != "sym" || !this.macros[this.ast.rawtree[this.i+3].val]){ this.err="Macro Call Not Defined or Invalid"; break; }
                            this.func[this.ast.rawtree[this.i+1].val] = eval(`()=>{ return \`${this.macros[this.ast.rawtree[this.i+3].val]}\`; }`);
                            this.i += 3;
                            break;

                        case("proc"):
                            //Procedure Definition
                            if(!(this.ast.rawtree[this.i+1].type == "sym") || !(this.ast.rawtree[this.i+2].type == "object") || !(this.ast.rawtree[this.i+2].pack == "{}")){ this.err="Invalid Process Definition"; break; }
                            this.alloc(this.ast.rawtree[this.i+1].val,"proc",1);
                            this.code += this.procScope(`${this._parseBlock(this.ast.rawtree[this.i+2].val)}`,this.vars[this.ast.rawtree[this.i+1].val].pos,this.ast.rawtree[this.i+1].val[0]=="_");
                            this.i += 2;
                            break;

                        case("exec"):
                            //Raw Code Execution
                            if(!(this.ast.rawtree[this.i+1].type == "object") || !(this.ast.rawtree[this.i+1].pack == "{}")){ this.err="Invalid Execution Block"; break; }
                            this.code += this._parseBlock(this.ast.rawtree[this.i+1].val);
                            this.i += 1;
                            break;

                        default:
                            this.err = `Unknown Parser Operation '${this.j.val}'`;
                            break;
                    }
                }else {
                    this.err = `Parser Encountered Invalid Operation Type '${this.ast.rawtree[this.i].type}'`;
                }
            }catch (err) {
                console.log(err);
                this.err = "Fatal Compiler Error";
            }
            if(this.err) break;
        }

        console.log(this.types,this.vars,this.func);
        return (this.err?this.err:this._postParse(`+>${this.predefcode}${this.pcode}<${(this.code.length>0?`[>${this.code}<]`:"")}`,3));
    }

    _postParse(bcode,times){
        let code = bcode;
        let ret = "";
        for(let unu = 0; unu < times; unu++){
            let state = {b: "", c:0, task:"src"};
            ret = "";
            let ccode = (code+" ").split("");
            for(let cha = 0; cha < ccode.length ;cha++){
                let ch = ccode[cha];
                switch(state.task){
                    case("src"):
                        state.b = "";
                        if(ch == ">"){
                            state.c = 1
                            state.task = "moveCut"
                        }else if(ch == "<"){
                            state.c = -1
                            state.task = "moveCut"
                        }else if(ch == "+"){
                            state.c = 1
                            state.task = "setCut"
                        }else if(ch == "-"){
                            state.c = -1
                            state.task = "setCut"
                        }else {
                            ret += ch;
                        }
                        break;
                    case("setCut"):
                        if(["+","-"].includes(ch)){
                            if(ch == "-"){
                                state.c -= 1;
                            }else {
                                state.c += 1;
                            }
                        }else {
                            ret += (state.c<0?"-".repeat(-state.c):"+".repeat(state.c));
                            cha--;
                            state.c = 0;
                            state.task="src";
                        }
                        break;
                    case("moveCut"):
                        if(["<",">"].includes(ch)){
                            if(ch == "<"){
                                state.c -= 1;
                            }else {
                                state.c += 1;
                            }
                        }else {
                            ret += (state.c<0?"<".repeat(-state.c):">".repeat(state.c));
                            cha--;
                            state.c = 0;
                            state.task="src";
                        }
                        break;
                    default:
                        ret = "@Unkown Task PostProcess Error"
                        break;
                }
                if(ret[0] == "@"){ break; }
            }
            code = ret;
            if(ret[0] == "@"){ break; }
        }
        return ret.trim();
    }

    defineEnum(name, data){
        for(let tempA = 0; tempA < data.rawtree.length; tempA+=3){
            if(data.rawtree[tempA].type != "sym"){ this.err="Invalid Enum Value Name"; break; }
            if(data.rawtree[tempA+1].type != "delim" || data.rawtree[tempA+1].val != "="){ this.err="Invalid Enum Delim"; break; }
            if(data.rawtree[tempA+2].type != "number" || data.rawtree[tempA+2].val <= -1 || data.rawtree[tempA+2].val >= 256){ this.err="Invalid Enum Byte Value"; break; }
            this.enums[`${name}.${data.rawtree[tempA].val}`] = data.rawtree[tempA+2].val;
        }
    }

    defineStruct(name, data){
        this.types[name] = {form:"struct",body:[]};
        for(this.tempPos = 0;this.tempPos < data.length;this.tempPos++){
            if(data[this.tempPos].type=="sym"){
                if(data[this.tempPos+1].type != "delim" || data[this.tempPos+1].val != ":"){ this.err="Variable Type Definition Requires ':'"; break; }
                if(!["sym","object"].includes(data[this.tempPos+2].type) && !this.types[data[this.tempPos+2].val]){ this.err=`Variable Type '${data[this.tempPos+2].val}' Not Found`; break; }
                if(data[this.tempPos+2].type == "object" && data[this.tempPos+2].pack == "{}"){
                    if(data[this.tempPos].val != "constructor"){ this.err=`Trying to Initiate Block in Struct outside of constructor`; break; };
                    this.types[name].body.push({name: data[this.tempPos].val,type: "",val: data[this.tempPos+2].val})
                    this.tempPos += 2;
                }else if(data[this.tempPos+3]&&(data[this.tempPos+3].type == "string" || data[this.tempPos+3].type == "delim")&&data[this.tempPos+3].pack == "]"){
                    if(data[this.tempPos+3].val != "*"&& isNaN(Number(data[this.tempPos+3].val))){ this.err="Invalid Type Size Definition"; break; }
                    this.types[name].body.push({name: data[this.tempPos].val,type: data[this.tempPos+2].val, size: data[this.tempPos+3].val});
                    this.tempPos += 3;
                }else {
                    this.types[name].body.push({name: data[this.tempPos].val,type: data[this.tempPos+2].val, size: 1});
                    this.tempPos += 2;
                }
            }else {
                this.err=`Invalid Struct Definition Found '${data[this.tempPos].val}'`
            }
            if(this.err) break;
        }
        return this.types[name];
    }

    whileScope(code,scope,out){
        this.tempPos = this.tapePos;
        return `${this.moveTape(scope)}[${this.moveTape(this.tempPos)}${code}${this.moveTape(scope)}${out??""}]${this.moveTape(this.tempPos)}`
    }

    procScope(code,scope,always){
        this.tempPos = this.tapePos;
        return `${this.moveTape(scope)}${(always?"[-]+":"")}[${this.moveTape(this.tempPos)}${code}${this.moveTape(scope)}-]${this.moveTape(this.tempPos)}`
    }

    inScope(code,scope){
        this.tempPos = this.tapePos;
        return `${this.moveTape(scope)}${code}${this.moveTape(this.tempPos)}`
    }

    moveTape(newpos){
        this.temp = this.tapePos;
        this.tapePos = newpos;
        return this.formula(`${this.temp} > ${newpos}`)
    }

    _parseBlock(tree) {
        //Parses a script block
        this.res = "";
        for(this.tokID = 0; this.tokID < tree.rawtree.length; this.tokID++){
            this.tok = tree.rawtree[this.tokID];
            if(this.tok.type == "sym"){
                if(tree.rawtree[this.tokID+1].type == "delim" && tree.rawtree[this.tokID+1].val == ";"){
                    try {
                        this.res += this.rawOps[this.tok.val](this);
                        this.tokID++
                        if(this.err){
                            this.err = `Operation "${this.tok.val}" : ${this.err}`;
                        }
                    }catch (err){
                        this.err = `Operation "${this.tok.val}" Not Found`;
                    }
                }else if(tree.rawtree[this.tokID+1].type == "object" && tree.rawtree[this.tokID+1].pack == "()"){
                    if(this.func[this.tok.val]){
                        try {
                            if(this.func[this.tok.val].length == tree.rawtree[this.tokID+1].val.rawtree.length){
                                this.res += this.func[this.tok.val].apply(this, tree.rawtree[this.tokID+1].val.rawtree);
                            }else {
                                this.err = "Invalid Arguments";
                            }
                            if(this.err){
                                this.err = `Function "${this.tok.val}" : ${this.err}`;
                            }
                        }catch(err) {
                            console.log(err);
                            this.err = `Function ${this.tok.val}: Internal Error`
                        }
                    }else {
                        this.err = `Function '${this.tok.val}' Not Found`;
                    }
                    this.tokID++
                }else {
                    this.err = `Code Block Encountered Invalid Operation`;
                }
            }else {
                this.err = `Code Block Encountered Invalid Operation Type '${this.tok.type}'`;
            }
            if(this.err) break;
        }
        return this.res;
    }

    alloc(name,type,size,barg){
        //Allocates Variables In Memory
        if(!this.types[type]){ this.err=`Cannot Allocate Variable Due To Undefined Type '${type}'`; return; }
        if(isNaN(size) || size<1){ this.err=`Invalid Variable Size`; return; }

        if(this.types[type].form=="std"){
            if(this.vars[name]){
                if(this.vars[name].type=="proc" && type=="proc"){
                }else {
                    this.err = `Cannot Overlap Variable '${name}'`;
                }
                return;
            }
            this.vars[name] = {pos: this.memPos,size: (this.types[type].sOff+(this.types[type].sFac*size)),type: type}
            if((barg??{}).child){
                this.vars[(barg??{}).child] = {pos: this.memPos,size: (this.types[type].sOff+(this.types[type].sFac*size)),type: type}
            }
            this.memPos += (this.types[type].sOff+(this.types[type].sFac*size));
        }else if(this.types[type].form=="struct"){
            this.tempDel = [];
            for(this.tempB of this.types[type].body){
                if(this.tempB.name=="constructor"){
                    this.tempC = this.tempB.val;
                }else {
                    if(this.types[this.tempB.type].form == "struct"){ this.err="Cannot Define Structs Within Structs"; break; }
                    this.alloc((this.tempB.name=="Prototype"?name:`${name}.${this.tempB.name}`),this.tempB.type,(this.tempB.size=="*"?size:Number(this.tempB.size)),{child: "this."+this.tempB.name});
                    this.tempDel.push("this."+this.tempB.name);
                }
            }
            this.predefcode += this._parseBlock(this.tempC);
            if(!(barg??{}).keeparg){
                for(this.tempB of this.tempDel){
                this.vars[this.tempB] = null;
                }
            }
        }else {
            this.err = "Invalid Datatype Form In Allocation";
        }
    }

    CheckToken(tok,type,val){
        return  (tok.type == type) && (tok.val == val)
    }

    formula(expr){
        this.ret = "";
        for(this.temp of expr.split('/')){
            this.tempb = this.temp.trim().split(' ');
            if(!isNaN(this.tempb[0])){
                if(!isNaN(this.tempb[2])){
                    this.ret += String((this.tempb[1]==">"||this.tempb[1]=="<"?([">","<","<",">"][(this.tempb[0]-this.tempb[2]<0)+(Number(this.tempb[1]==">")*2)]):this.tempb[1])).repeat(Math.abs(this.tempb[0]-this.tempb[2]));
                }else {
                    this.ret += String(this.tempb[1]).repeat(this.tempb[0]);
                }
            }else {
                this.ret += this.tempb.join("");
            }
        }
        return this.ret;
    }
}

function _BrainfuckppLexer (txt,res){
	this.tokens = [];
	this.state = "sym";
	this.pack = "";
	this.c = "";
	this.txt = txt.split("");
  
	//Tokenization
	for(this.t of this.txt){
		switch(this.state){
			case("sym"):
				if(res[this.t]){
					if(this.c.length>0){
						this.tokens[this.tokens.length] = {type:this.state,val:this.c};
					}
					if((res[this.t][2]??false)){
						this.c = this.t;
					}else {
						this.c = "";
					}
					this.state = res[this.t][0];
					this.pack = res[this.t][1];
				}else {
					this.c = `${this.c}${this.t}`;
				}
				break
            case("comment"):
				if(this.t==this.pack){
					this.c = "";
					this.state = "sym";
				}
				break
			case("string"):
				if(this.t==this.pack){
					this.tokens[this.tokens.length] = {type:this.state,val:this.c,pack:this.pack};
					this.c = "";
					this.state = "sym";
				}else {
					this.c = `${this.c}${this.t}`;
				}
				break
			case("delim"):
				this.tokens[this.tokens.length] = {type:this.state,val:this.c,pack:this.pack};
				if(res[this.t]){
					if((res[this.t][2]??false)){
						this.c = this.t;
					}else {
						this.c = "";
					}
					this.state = res[this.t][0];
					this.pack = res[this.t][1];
				}else {
					this.state = "sym";
					this.c = this.t;
				}
				break
			case("break"):
				if(res[this.t]){
					if((res[this.t][2]??false)){
						this.c = this.t;
					}else {
						this.c = "";
					}
					this.state = res[this.t][0];
					this.pack = res[this.t][1];
				}else {
					this.state = "sym";
					this.c = `${this.c}${this.t}`;
				}
				break
		}
	}
	if(this.c.length>0){
		this.tokens[this.tokens.length] = {type:this.state,val:this.c};
	}

	//Token Lexical Packer
	this.ret = new Lexpacker(this.tokens);
	
	return this.ret;
}

class ValueTree {
	constructor(tree){
		this.rawtree = tree;
	}
	
	RecurseTree(func,ret){
		this.ret = ret??[];
		for(this.t of this.rawtree){
			if(this.t.type=="object"){
				this.ret = this.t.val.RecurseTree(func,this.ret);
			}else {
				this.ret = func(this.t,this.ret,this);
			}
		}
		return this.ret;
	}

	CoerceNum(){
		this.Identify(["sym","any"],(tok)=>{
			if(!isNaN(Number(tok.val))){
				tok.type = "number";
				tok.val = Number(tok.val);
			}
		});
		return this.rawtree;
    }
  
    GetValue(id){
      return this.rawtree[id].val
    }

	Flatten() {
		return this.RecurseTree((tok,ret,parent)=>{
			this.r = ret;
			this.r[this.r.length] = tok;
			return this.r;
		});
	}
	
	Identify(disc,func){
		this.RecurseTree((tok,ret,parent)=>{
			if((tok.type==ret[0][0]||ret[0][0]=="any")&&(tok.val==ret[0][1]||ret[0][1]=="any")){
				ret[1](tok);
			}
			return ret;
		},[disc,func]);
		return this.rawtree;
	}

	Replace(disc,res){
		this.RecurseTree((tok,ret,parent)=>{
			if((tok.type==ret[0][0]||ret[0][0]=="any")&&(tok.val==ret[0][1]||ret[0][1]=="any")){
				tok.type = (ret[1][0]=="any"?tok.type:ret[1][0]);
				tok.val = (ret[1][1]=="any"?tok.val:ret[1][1]);;
			}
			return ret;
		},[disc,res]);
		console.log(this.rawtree);
		return this.rawtree;
	}
}

function Lexpacker (items){
		this.ret = [];
		this.state = "run";
        this.pack = "";
        this.skip = 0;
		this.c = [];
		for(this.t in items){
			switch(this.state){
				case("run"):
					if(items[this.t].type=="delim"&&items[this.t].pack.length > 0){
						this.c = [];
						this.state = "build";
						this.pack = `${items[this.t].val}${items[this.t].pack}`;
                        this.skip = 1;
					}else {
						this.ret[this.ret.length] = items[this.t];
					}
					break
				case("build"):
					if(items[this.t].type=="delim"&&items[this.t].val==this.pack[1]){
                        this.skip -= 1;
                        if(this.skip == 0){
                          this.ret[this.ret.length] = {type:"object",pack:this.pack,val:(new Lexpacker(this.c))};
                          this.state = "run";
                        }else {
                          this.c[this.c.length] = items[this.t];
                        }
                    }else if(items[this.t].type=="delim"&&items[this.t].val==this.pack[0]){
                        this.c[this.c.length] = items[this.t];
                        this.skip += 1;
					}else {
						this.c[this.c.length] = items[this.t];
					}
					break
			}
		}
		return new ValueTree(this.ret);
	}