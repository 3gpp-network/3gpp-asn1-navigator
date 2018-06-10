%lex
%s TRAILING
%%

\n                              this.begin('INITIAL');
\s                              /* skip whitespace */
<TRAILING>'-- Need '\w+         return 'NEED_CODE'
<TRAILING>'-- Cond'             return 'COND'
'--'.*                          /* skip comment */
'ABSENT'                        return 'ABSENT'
'AUTOMATIC'                     return 'AUTOMATIC'
'BEGIN'                         return 'BEGIN'
'BIT STRING'                    return 'BIT_STRING'
'BOOLEAN'                       return 'BOOLEAN'
'CHOICE'                        return 'CHOICE'
'COMPONENTS'                    return 'COMPONENTS'
'CONTAINING'                    return 'CONTAINING'
'DEFAULT'                       return 'DEFAULT'
'DEFINITIONS'                   return 'DEFINITIONS'
'END'                           return 'END'
'ENUMERATED'                    return 'ENUMERATED'
'FROM'                          return 'FROM'
'false'                         return 'false'
'IMPORTS'                       return 'IMPORTS'
'INTEGER'                       return 'INTEGER'
'OCTET STRING'                  return 'OCTET_STRING'
'OF'                            return 'OF'
'OPTIONAL'                      this.begin('TRAILING'); return 'OPTIONAL'
'PRESENT'                       return 'PRESENT'
'SEQUENCE'                      return 'SEQUENCE'
'SIZE'                          return 'SIZE'
'TAGS'                          return 'TAGS'
'true'                          return 'true'
'WITH'                          return 'WITH'
','                             return ','
'NULL'                          return 'NULL'
'\''.*'\'B'                     return 'BIT_STRING_EXPRESSION'
[a-zA-Z]('-'?\w*)*              this.begin('TRAILING'); return 'IDENTIFIER'
'-'?\d+                         return 'NUMERIC'
'...'                           return '...'
'..'                            return '..'
';'                             return ';'
'::='                           return '::='
'('                             return '('
')'                             return ')'
'[['                            return '[['
']]'                            return ']]'
'{'                             return '{'
'}'                             this.begin('TRAILING'); return '}'
<<EOF>>                         return 'EOF'
.                               return 'INVALID'

/lex

%right '::='

%start modules
%%

modules
    : modules EOF
        {return $1;}
    | modules module
        {$$ = Object.assign($1, $2);}
    | module
        {$$ = $1;}
    ;

module
    : 'IDENTIFIER' 'DEFINITIONS' 'AUTOMATIC' 'TAGS' '::=' 'BEGIN' expressions 'END'
        {var obj = {}; obj[$1] = $7; $$ = obj;}
    ;

expressions
    : expressions expression
        {$$ = Object.assign($1, $2);}
    | expression
        {$$ = $1;}
    ;

expression
    : definition
    | assignment
        {$$ = $1;}
    | import
        {$$ = {import: $1};}
    ;

definition
    : 'IDENTIFIER' '::=' type
        {var obj = {}; obj[$1] = $3; $$ = obj;}
    | 'IDENTIFIER' nameList '::=' type
        {
            var obj = {};
            obj[$1] = Object.assign($4, {parameterisedType: true, parameters: $2});
            for (let item of $2) {
                var index = obj[$1]['inventory'].indexOf(item);
                if (index == -1) {
                    continue;
                }
                obj[$1]['inventory'].splice(index, 1);
            }
            if (!obj[$1]['inventory'].length) {
                delete obj[$1]['inventory'];
            }
        $$ = obj;
        }
    ;

assignment
    : 'IDENTIFIER' 'INTEGER' '::=' 'NUMERIC'
        {var obj = {}; obj[$1] = {type: $2, value: Number($4)}; $$ = obj;}
    ;

import
    : 'IMPORTS' importList ';'
        {$$ = $2;}
    ;

importList
    : importList importMember
        {$$ = Object.assign($1, $2);}
    | importMember
        {$$ = $1;}
    ;

importMember
    : nameMembers 'FROM' 'IDENTIFIER'
        {var obj = {}; obj[$3] = $1; $$ = obj}
    ;

type
    : builtinType
        {$$ = $1;}
    | 'IDENTIFIER' nameList
        {$$ = {type: $1, parameters: $2,
               inventory: Array.prototype.concat($1, $2)};}
    | 'IDENTIFIER' withComponentsExpression
        {$$ = {type: $1, withComponents: $2};}
    | 'IDENTIFIER'
        {$$ = {type: $1, inventory: [$1]};}
    ;

builtinType
    : bitString
    | boolean
    | choice
    | enumerated
    | integer
    | null
    | octetString
    | sequence
    | sequenceOf
        {$$ = $1;}
    ;

bitString
    : 'BIT_STRING' sizeExpression
        {$$ = Object.assign({type: $1}, $2);}
    | 'BIT_STRING'
        {$$ = {type: $1};}
    ;

boolean
    : 'BOOLEAN'
        {$$ = {type: $1};}
    ;

choice
    : 'CHOICE' nameTypeList
        {
            var inventory = $2.reduce(function(accum, curr, currIndex, array) {
                if ('inventory' in curr) {
                    for (let item of curr['inventory']) {
                        if (!accum.includes(item)) {
                            accum = accum.concat(item);
                        }
                    }
                    delete curr['inventory'];
                }
                return accum;
            }, []);
            var obj = {type: $1, content: $2};
            if (inventory.length) {
                Object.assign(obj, {inventory: inventory});
            }
            $$ = obj;
        }
    ;

enumerated
    : 'ENUMERATED' nameList
        {$$ = {type: $1, content: $2};}
    ;

integer
    : 'INTEGER' rangeExpression
        {
            var obj = Object.assign({type: $1}, $2);
            if ('inventory' in $2) {
                var inventory = $2['inventory'];
                delete $2['inventory'];
                Object.assign(obj, {inventory: inventory});
            }
            $$ = obj;
        }
    | 'INTEGER' constExpression
        {$$ = {type: $1, value: $2};}
    | 'INTEGER'
        {$$ = {type: $1};}
    ;

null
    : 'NULL'
        {$$ = {type: $1};}
    ;

octetString
    : 'OCTET_STRING'
        {$$ = {type: $1};}
    | 'OCTET_STRING' containingExpression
        {$$ = Object.assign({type: $1}, $2);}
    | 'OCTET_STRING' sizeExpression
        {$$ = Object.assign({type: $1}, $2);}
    ;

sequence
    : 'SEQUENCE' nameTypeOptionalList
        {
            var inventory = $2.reduce(function(accum, curr, currIndex, array) {
                if ('inventory' in curr) {
                    for (let item of curr['inventory']) {
                        if (!accum.includes(item)) {
                            accum = accum.concat(item);
                        }
                    }
                    delete curr['inventory'];
                }
                return accum;
            }, []);
            var obj = {type: $1, content: $2};
            if (inventory.length) {
                Object.assign(obj, {inventory: inventory});
            }
            $$ = obj;
         }
    ;

sequenceOf
    : 'SEQUENCE' sizeExpression 'OF' type
        {
            var builtins = ['BIT STRING' ,'BOOLEAN', 'CHOICE' ,'CONTAINING',
            'ENUMERATED', 'INTEGER', 'OCTET STRING', 'SEQUENCE'];
            var obj = Object.assign({type: $1 + ' ' + $3, member: $4}, $2);
            if ('inventory' in obj['member']) {
                for (let item of obj['member']['inventory']) {
                    if (builtins.includes(item)) {
                        continue;
                    }
                    if (!('inventory' in obj)) {
                        obj['inventory'] = [item];
                    } else {
                        if (!obj['inventory'].includes(item)) {
                            obj['inventory'] = obj['inventory'].concat(item);
                        }
                    }
                }
                delete obj['member']['inventory'];
            }
            $$ = obj;
        }
    ;

sizeExpression
    : '(' 'SIZE' rangeExpression ')'
        {
            var obj = {sizeMin: $3.start, sizeMax: $3.end};
            if ('inventory' in $3) {
                Object.assign(obj, {inventory: $3['inventory']});
            }
            $$ = obj;
        }
    | '(' 'SIZE' constExpression ')'
        {
            var obj = {size: ($3 == Number($3) ? Number($3) : $3)};
            if (typeof $3 == 'string') {
                var inventory = $3;
                var index = inventory.lastIndexOf('-');
                if (inventory.substring(index) == Number(inventory.substring(index))) {
                    inventory = inventory.substring(0, index);
                }
                Object.assign(obj, {inventory: [inventory]});
            }
            $$ = obj;
        }
    ;

constExpression
    : '(' 'NUMERIC' ')'
        {$$ = Number($2);}
    | '(' 'IDENTIFIER' ')'
        {$$ = $2;}
    ;

rangeExpression
    : '(' 'NUMERIC' '..' 'NUMERIC' ')'
        {$$ = {start: Number($2), end: Number($4)};}
    | '(' 'NUMERIC' '..' 'IDENTIFIER' ')'
        {
            var obj = {start: Number($2), end: $4};
            var inventory = $4;
            var index = inventory.lastIndexOf('-');
            if (inventory.substring(index) == Number(inventory.substring(index))) {
                inventory = inventory.substring(0, index);
            }
            $$ = Object.assign(obj, {inventory: [inventory]});
        }
    | '(' 'IDENTIFIER' '..' 'NUMBER' ')'
        {
            var obj = {start: $2, end: Number($4)};
            var inventory = $2;
            var index = inventory.lastIndexOf('-');
            if (inventory.substring(index) == Number(inventory.substring(index))) {
                inventory = inventory.substring(0, index);
            }
            $$ = Object.assign(obj, {inventory: [inventory]});
        }
    | '(' 'IDENTIFIER' '..' 'IDENTIFIER' ')'
        {
            var obj = {start: $2, end: $4};
            var inventory = [$2, $4];
            for (let i in inventory) {
                var index = inventory[i].lastIndexOf('-');
                if (inventory[i].substring(index) == Number(inventory[i].substring(index))) {
                    inventory[i] = inventory[i].substring(0, index);
                }
            }
            $$ = Object.assign(obj, {inventory: inventory});
        }
    ;

containingExpression
    : '(' 'CONTAINING' type ')'
        {$$ = {containing: $3['type'], inventory: [$3['type']]};}
    ;

nameTypeList
    : '{' nameTypeMembers '}'
        {$$ = $2;}
    ;

nameTypeMembers
    : nameTypeMembers ',' nameTypeMember
        {$$ = Array.prototype.concat($1, $3);}
    | nameTypeMembers ',' 'COND' 'IDENTIFIER' nameTypeMember
        {Object.assign($1[$1.length - 1], {condition: $4});
         $$ = Array.prototype.concat($1, $5);}
    | nameTypeMember
        {$$ = Array.prototype.concat([], $1);}
    ;

nameTypeMember
    : 'IDENTIFIER' type
        {$$ = Object.assign({name: $1}, $2);}
    | 'IDENTIFIER' type 'COND' 'IDENTIFIER'
        {$$ = Object.assign({name: $1, condition: $4}, $2);}
    | '...'
        {$$ = {name: $1};}
    |
        {$$ = [];}
    ;

nameList
    : '{' nameMembers '}'
        {$$ = $2;}
    ;

nameMembers
    : nameMembers ',' nameMember
        {$$ = Array.prototype.concat($1, $3);}
    | nameMember
        {$$ = Array.prototype.concat([], $1);}
    ;

nameMember
    : 'IDENTIFIER' | '...'
    | 'true'
    | 'false'
        {$$ = $1;}
    |
        {$$ = [];}
    ;

nameTypeOptionalList
    : '{' nameTypeOptionalMembers '}'
        {$$ = $2;}
    ;

nameTypeOptionalMembers
    : nameTypeOptionalMembers ',' nameTypeOptionalMember
        {$$ = Array.prototype.concat($1, $3);}
    | nameTypeOptionalMembers ',' '[[' nameTypeOptionalExtensionAdditionGroupMembers ']]'
        {
            var inventory = $4.reduce(function(accum, curr, currIndex, array) {
                if ('inventory' in curr) {
                    for (let item of curr['inventory']) {
                        if (!accum.includes(item)) {
                            accum = accum.concat(item);
                        }
                    }
                    delete curr['inventory'];
                }
                return accum;
            }, []);
            var obj = {};
            Object.assign(obj, {extensionAdditionGroup: $4}, {inventory: inventory});
            $$ = Array.prototype.concat($1, obj);
        }
    | nameTypeOptionalMembers ',' 'NEED_CODE' nameTypeOptionalMember
        {Object.assign($1[$1.length - 1], {needCode: $3});
         $$ = Array.prototype.concat($1, $4);}
    | nameTypeOptionalMembers ',' 'COND' 'IDENTIFIER' nameTypeOptionalMember
        {Object.assign($1[$1.length - 1], {condition: $4});
         $$ = Array.prototype.concat($1, $5);}
    | nameTypeOptionalMember
        {$$ = Array.prototype.concat([], $1);}
    ;

nameTypeOptionalExtensionAdditionGroupMembers
    : nameTypeOptionalExtensionAdditionGroupMembers ',' nameTypeOptionalMember
        {$$ = Array.prototype.concat($1, $3);}
    | nameTypeOptionalExtensionAdditionGroupMembers ',' 'NEED_CODE' nameTypeOptionalMember
        {Object.assign($1[$1.length - 1], {needCode: $3});
         $$ = Array.prototype.concat($1, $4);}
    | nameTypeOptionalExtensionAdditionGroupMembers ',' 'COND' 'IDENTIFIER' nameTypeOptionalMember
        {Object.assign($1[$1.length - 1], {condition: $4});
         $$ = Array.prototype.concat($1, $5);}
    | nameTypeOptionalMember
        {$$ = Array.prototype.concat([], $1);}
    ;

nameTypeOptionalMember
    : 'IDENTIFIER' type
        {$$ = Object.assign({name: $1}, $2);}
    | 'IDENTIFIER' type 'OPTIONAL'
        {$$ = Object.assign({name: $1,optional: true}, $2);}
    | 'IDENTIFIER' type 'OPTIONAL' 'NEED_CODE'
        {$$ = Object.assign({name: $1, optional: true, needCode: $4}, $2);}
    | 'IDENTIFIER' type 'OPTIONAL' 'COND' 'IDENTIFIER'
        {$$ = Object.assign({name: $1, optional: true, condition: $5}, $2);}
    | 'IDENTIFIER' type 'DEFAULT' 'IDENTIFIER'
        {$$ = Object.assign({name: $1, default: $4}, $2);}
    | 'IDENTIFIER' type 'DEFAULT' 'BIT_STRING_EXPRESSION'
        {$$ = Object.assign({name: $1, default: $4}, $2);}
    | 'IDENTIFIER' type 'DEFAULT' 'NUMERIC'
        {$$ = Object.assign({name: $1, default: Number($4)}, $2);}
    | '...'
        {$$ = {name: $1};}
    |
        {$$ = [];}
    ;

withComponentsExpression
    : '(' 'WITH' 'COMPONENTS' namePresentAbsentList ')'
        {$$ = $4;}
    ;

namePresentAbsentList
    : '{' namePresentAbsentMembers '}'
        {$$ = $2;}
    ;

namePresentAbsentMembers
    : namePresentAbsentMembers ',' namePresentAbsentMember
        {$$ = Array.prototype.concat($1, $3);}
    | namePresentAbsentMember
        {$$ = Array.prototype.concat([], $1);}
    ;

namePresentAbsentMember
    : 'IDENTIFIER' 'PRESENT'
        {$$ = Object.assign({name: $1}, {present: true});}
    | 'IDENTIFIER' 'ABSENT'
        {$$ = Object.assign({name: $1}, {absent: true});}
    | '...'
        {$$ = {name: $1};}
    |
        {$$ = [];}
    ;
