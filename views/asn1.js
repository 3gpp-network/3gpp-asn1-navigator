var jp = jsPlumb.getInstance();
var maxZIndex = 0;

var formConsole = $('#formConsole');
var inputQuery = $('#inputQuery');
var buttonQuery = $('#buttonQuery');
var buttonClearView = $('#buttonClearView')
var canvas = $('#canvas');

inputQuery.ready(checkInputQuery);
inputQuery.change(checkInputQuery);
inputQuery.keyup(checkInputQuery);

function checkInputQuery() {
    if (inputQuery.val()) {
        buttonQuery.prop('disabled', false);
    } else {
        buttonQuery.prop('disabled', true);
    }
}

formConsole.submit(function(event) {
    if (inputQuery.val()) {
        getAsn1(inputQuery.val());
    }
    event.preventDefault();
});

buttonQuery.click(function() {
    getAsn1(inputQuery.val());
});

buttonClearView.click(function() {
    $('.card').hide();
    for (let connection of jp.getConnections()) {
        showConnection(connection, false);
    }
});

function closeAsn1(specNumberName) {
    let card = $(`#${specNumberName}`);
    card.hide();
    for (let connection of getConnections(jp, card)) {
        showConnection(connection, false);
    }
}

function getAsn1(input, owner = null) {
    $.get(`/get/${input}`, function(asn1PerSpec) {
        for (let specNumber in asn1PerSpec) {
            for (let moduleName in asn1PerSpec[specNumber]) {
                drawAsn1(asn1PerSpec[specNumber][moduleName], input,
                         specNumber);
                let card = $(`#${specNumber}-${input}`);
                if (owner) {
                    let source = $(`#${owner}`);
                    let target = card;
                    drawConnection(jp, source, target);
                }
                for (let connection of getConnections(jp, card)) {
                    if ($(connection.source).is(':visible') &&
                        $(connection.target).is(':visible')) {
                        showConnection(connection, true);
                    }
                }
            }
        }
    });
}

function getAsn1Owner(input, child) {
    $.get(`/owner/${input}`, function(asn1PerSpec) {
        for (let specNumber in asn1PerSpec) {
            for (let moduleName in asn1PerSpec[specNumber]) {
                for (let key in asn1PerSpec[specNumber][moduleName]) {
                    drawAsn1(asn1PerSpec[specNumber][moduleName][key], key,
                             specNumber);
                    let owner = `${specNumber}-${key}`;
                    let source = $(`#${owner}`);
                    let target = $(`#${child}`);
                    drawConnection(jp, source, target);
                }
            }
        }
    });
}

function showConnection(connection, bool) {
    connection.setVisible(bool);
    connection.endpoints[0].setVisible(bool);
    connection.endpoints[1].setVisible(bool);
}

function getConnections(jp, card) {
    let ret = [];
    for (let connection of jp.getConnections()) {
        // [0] is required to convert jQuery object to tag...?
        if (connection.source == card[0] || connection.target == card[0]) {
            ret.push(connection);
        }
    }
    return ret;
}

function getConnection(jp, card1, card2) {
    let connections = jp.getConnections();
    for (let connection of connections) {
        // [0] is required to convert jQuery object to tag...?
        if ((connection.source == card1[0] && connection.target == card2[0]) ||
            (connection.source == card2[0] && connection.target == card1[0])) {
            return connection;
        }
    }
    return false;
}

function drawConnection(jp, source, target) {
    let connection = getConnection(jp, source, target);
    if (connection) {
        showConnection(connection, true);
    } else {
        jp.connect({
            source: source,
            target: target,
            endpoint: 'Blank',
            connector: ['StateMachine'],
            anchors: [
                ['Perimeter', {shape: 'Square'}],
                ['Perimeter', {shape: 'Square'}],
            ],
            overlays: [
                ['Arrow', {width: 10, length: 10,
                           location: 0, direction: -1}],
            ],
            detachable: false,
        });
    }
}

function drawAsn1(asn1, name, specNumber) {
    let specNumberName = specNumber + '-' + name;
    let card = $(`#${specNumberName}`);
    if (card.length) {
        card.show();
    } else {
        card = createCard(asn1, name, specNumber);
    }
    jp.draggable(card, {
        start: function(params) {
            params.el.style.zIndex = ++maxZIndex;
        }
    });
    card.width(card.width());
    card.css('zIndex', ++maxZIndex);
}

function createCard(asn1, name, specNumber) {
    let specNumberName = specNumber + '-' + name;
    let card = $(
        `<div id="${specNumberName}" class="card bg-light"
            style="position: absolute;">
            <div class="card-header container p-2">
                <div class="row">
                    <div class="col">
                        ${name}
                        <span class="badge badge-info ml-2">
                            ${specNumber}
                        </span>
                    </div>
                    <div class="col-md-auto">
                        <a href="#" onclick="closeAsn1('${specNumberName}')"
                            style="color: #f00;">
                            <i class="fas fa-times"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="card-body p-2">
                <table class="table table-sm table-striped small">
                    ${formatAsn1(asn1, specNumberName)}
                </table>
                <div class="text-right">
                    <a href="#" onclick="getAsn1Owner('${name}',
                                                    '${specNumberName}')"
                    class="badge badge-primary">Owner</a>
                    <a href="#" class="badge badge-secondary ml-2">
                        Ancestor
                    </a>
                </div>
            </div>
        </div>`);
    canvas.append(card);
    return card;
}

function formatAsn1(asn1Json, specNumberName = null, depth = 0) {
    let name = 'name' in asn1Json ? asn1Json['name'] : '';
    let type;
    let option = getOption(asn1Json);
    let ret = '';
    if ('type' in asn1Json) {
        switch (asn1Json['type']) {
            case 'BIT STRING':
                ret = addRow(depth, name,
                                `${asn1Json['type']}
                                ${getSizeExpression(asn1Json, specNumberName)}`,
                                option);
                break;
            case 'BOOLEAN':
                ret = addRow(depth, name, asn1Json['type'], option);
                break;
            case 'ENUMERATED':
                type = `${asn1Json['type']} {${asn1Json['content'].join(', ')}}`;
                ret = addRow(depth, name, type, option);
                break;
            case 'INTEGER':
                type = `${asn1Json['type']} ${integerHelper(asn1Json, specNumberName)}`;
                ret = addRow(depth, name, type, option);
                break;
            case 'NULL':
                ret = addRow(depth, name, asn1Json['type'], option);
                break;
            case 'OCTET STRING':
                type = asn1Json['type'];
                if ('containing' in asn1Json) {
                    type += `(CONTAINING ${customTypeLink(asn1Json['containing'],
                                                         specNumberName)})`;
                }
                ret = addRow(depth, name, type, option);
                break;
            case 'SEQUENCE OF':
                type = `SEQUENCE ${getSizeExpression(asn1Json, specNumberName)}
                        OF
                        ${customTypeLink(asn1Json['member']['type'], specNumberName)}
                        ${integerHelper(asn1Json['member'], specNumberName)}`;
                ret = addRow(depth, name, type, option);
                if ('content' in asn1Json['member']) {
                    for (let item of asn1Json['member']['content']) {
                        ret += formatAsn1(item, specNumberName, depth + 1);
                    }
                }
                break;
            case 'CHOICE':
            case 'SEQUENCE':
                ret = addRow(depth, name, asn1Json['type'], option);
                for (let item of asn1Json['content']) {
                    ret += formatAsn1(item, specNumberName, depth + 1);
                }
                break;
            default:
                type = customTypeLink(asn1Json['type'], specNumberName);
                if ('parameters' in asn1Json) {
                    type += `{${asn1Json['parameters'].map(function (item) {
                                return customTypeLink(item, specNumberName);
                            }).join(', ')}}`;
                } else if ('withComponents' in asn1Json) {
                    type += `(WITH COMPONENTS {${asn1Json['withComponents']
                                    .map(function(item) {
                                        if ('present' in item) {
                                            return `${item['name']} PRESENT`;
                                        }
                                        if ('absent' in item) {
                                            return `${item['name']} ABSENT`;
                                        }
                                        return item['name'];
                                    }).join(', ')}})`;
                }
                ret = addRow(depth, name, type, option);
                break;
        }
    } else if ('name' in asn1Json) {
        // e.g., name: '...'
        ret = addRow(depth, name, '', getOption(asn1Json));
    } else if ('extensionAdditionGroup' in asn1Json) {
        ret = addRow(depth, '[[', '', '');
        for (let item of asn1Json['extensionAdditionGroup']) {
            ret += formatAsn1(item, specNumberName, depth);
        }
        ret += addRow(depth, ']]', '', '');
    }
    return ret; 
}

function getOption(asn1Json) {
    if ('default' in asn1Json){
        return `D: ${asn1Json['default']}`;
    }
    if ('condition' in asn1Json) {
        return `C: ${asn1Json['condition']}`;
    }
    if ('needCode' in asn1Json) {
        // -- Need X
        return asn1Json['needCode'].substring(3);
    }
    if ('optional' in asn1Json) {
        return 'OPTIONAL';
    }
    return '';
}

function addRow(depth, name, type, optional) {
    return  `<tr>
                <td style="padding-left: ${20 * depth}px">
                    ${name}
                </td>
                <td style="max-width: 300px;">
                    ${type}
                </td>
                <td>
                    ${optional}
                </td>
            </tr>`;
}

function integerHelper(asn1Json, specNumberName) {
    let ret = '';
    if ('value' in asn1Json || 'start' in asn1Json) {
        ret += '(';
        if ('value' in asn1Json) {
            ret += customTypeLink(asn1Json['value'], specNumberName);
        } else if ('start' in asn1Json) {
            ret += `${customTypeLink(asn1Json['start'], specNumberName)}..
                     ${customTypeLink(asn1Json['end'], specNumberName)}`;
        }
        ret += ')';
    }
    return ret;
}

function getSizeExpression(asn1Json, specNumberName) {
    let ret = '';
    if ('size' in asn1Json || 'sizeMin' in asn1Json) {
        ret = '(SIZE(';
        if ('size' in asn1Json) {
            ret += customTypeLink(asn1Json['size'], specNumberName);
        } else if ('sizeMin' in asn1Json) {
            ret += `${customTypeLink(asn1Json['sizeMin'], specNumberName)}..
                    ${customTypeLink(asn1Json['sizeMax'], specNumberName)}`;
        }
        ret += '))';
    }
    return ret;
}

var builtIns = ['BIT STRING', 'BOOLEAN', 'ENUMERATED', 'INTEGER', 'NULL',
                'OCTET STRING', 'CHOICE', 'SEQUENCE', 'OF'];

function customTypeLink(type, owner) {
    if (Number(type) == type || builtIns.includes(type)) {
        return type;
    }
    return `<a href="#" onclick="getAsn1('${type}', '${owner}')"
                class="${type}">${type}</a>`;
}
