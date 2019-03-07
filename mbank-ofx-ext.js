document.getElementById("test").addEventListener('click', () => {
    function modifyDOM() {
        var body = {
            SIGNONMSGSRQV1: {
                SONRQ: {
                    DTCLIENT: 'value',
                    USERID: 'user id',
                    USERPASS: 'password',
                    LANGUAGE: 'ENG',
                    FI: {
                        ORG: 'org',
                        FID: 'fid'
                    },
                    APPID: 'QWIN',
                    APPVER: '2100',
                    CLIENTUID: 'needed by some places'
                }
            },
            BANKMSGSRSV1: {
                STMTTRNRS: {
                    STMTRS: {
                        BANKTRANLIST: []
                    }
                }
            }
        };

        var objToOfx = function (obj) {
            var out = '';

            Object.keys(obj).forEach(function (name) {
                var item = obj[name];
                var start = '<' + name + '>';
                var end = '</' + name + '>';

                if (item instanceof Object) {
                    if (item instanceof Array) {
                        out += start + '\n';
                        item.forEach(function (it) {
                            out += objToOfx(it);
                        });
                        out += end + '\n';
                        return;
                    }
                    return out += start + '\n' + objToOfx(item) + end + '\n';
                }
                out += start + item + end + '\n';
            });

            return out;
        }

        var parseRow = function (element) {
            var label = element.getElementsByClassName("label")[0].textContent.trim().replace(/ +(?= )/g, '');
            var date = element.getAttribute('data-timestamp').substring(0,10) 
            var amount = element.getAttribute('data-amount') 
            var formattedDate = date.replace(/-/g, '')
            var STMTTRN = {
                STMTTRN: {
                    DTPOSTED: formattedDate,
                    DTUSER: formattedDate,
                    DTAVAIL: formattedDate,
                    TRNAMT: amount,
                    PAYEEID: label,
                    NAME: label
                }
            }
            return STMTTRN;
        }

        var ul = document.getElementsByClassName("content-list-body");
        var items = ul[0].getElementsByClassName("content-list-row");
        for (var i = 0; i < items.length; ++i) {
            var element = parseRow(items[i])
            body.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.push(element)
        }
        var result = objToOfx({ OFX: body })
        console.log(result)
        return result;
    }

    let toDownload = function (content) {
        console.log("Downloading...")
        let doc = URL.createObjectURL(new Blob([content], { type: 'application/octet-binary' }));
        let filename = '_' + new Date().toISOString().substring(0, 10) + '.ofx';
        chrome.downloads.download({ url: doc, filename: filename, conflictAction: 'overwrite', saveAs: true });
    }

    //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    chrome.tabs.executeScript(null, {
        code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
    }, toDownload);
});