"""Extrai apenas produtos e preços públicos; não exporta clientes nem pedidos.

Python 3, biblioteca padrão. Uso: python3 scripts/extract-uci-retail.py arquivo.xlsx
Fonte: Chen, D. (2015), Online Retail, https://doi.org/10.24432/C5BW33, CC BY 4.0.
"""
import datetime as dt
import decimal
import hashlib
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
EXPECTED = ['InvoiceNo', 'StockCode', 'Description', 'Quantity', 'InvoiceDate', 'UnitPrice', 'CustomerID', 'Country']

def extract(filename):
    digest = hashlib.sha256()
    with open(filename, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    products, scanned, rejected = {}, 0, 0
    with zipfile.ZipFile(filename) as book:
        if sum(i.file_size for i in book.infolist()) > 400 * 1024 * 1024:
            raise ValueError('Planilha acima do limite de descompactação')
        strings = []
        if 'xl/sharedStrings.xml' in book.namelist():
            with book.open('xl/sharedStrings.xml') as stream:
                for _, element in ET.iterparse(stream, events=['end']):
                    if element.tag == NS + 'si':
                        strings.append(''.join(t.text or '' for t in element.iter(NS + 't')))
                        element.clear()
        with book.open('xl/worksheets/sheet1.xml') as stream:
            header = None
            for _, row in ET.iterparse(stream, events=['end']):
                if row.tag != NS + 'row':
                    continue
                values = {}
                for cell in row.findall(NS + 'c'):
                    column = re.sub(r'\d', '', cell.get('r', ''))
                    value = cell.findtext(NS + 'v', '')
                    if cell.get('t') == 's':
                        value = strings[int(value)] if value else ''
                    elif cell.get('t') == 'inlineStr':
                        value = ''.join(t.text or '' for t in cell.iter(NS + 't'))
                    values[column] = value
                if header is None:
                    header = [values.get(chr(65+i), '') for i in range(8)]
                    if header != EXPECTED:
                        raise ValueError('Formato incompatível com UCI Online Retail 352')
                    row.clear()
                    continue
                scanned += 1
                try:
                    invoice = values.get('A', '').strip()
                    code, name = values.get('B', '').strip(), values.get('C', '').strip()
                    quantity = decimal.Decimal(values.get('D', '0'))
                    price = decimal.Decimal(values.get('F', '0'))
                    serial = float(values.get('E', '0'))
                    date = dt.datetime(1899, 12, 30) + dt.timedelta(days=serial)
                    if (invoice.upper().startswith('C') or not re.fullmatch(r'\d{5}[A-Z]?', code)
                        or not name or len(name) > 240 or not quantity.is_finite() or quantity <= 0
                        or not price.is_finite() or not 0 < price < 100000000
                        or not dt.datetime(2010,12,1) <= date < dt.datetime(2011,12,10)):
                        raise ValueError('Registro sem preço de venda aproveitável')
                    observation = {'productCode': code, 'name': name, 'price': str(price),
                                   'currency': 'GBP', 'observedAt': date.isoformat(timespec='seconds')}
                    # Uma observação por SKU: a venda válida mais recente.
                    if code not in products or observation['observedAt'] >= products[code]['observedAt']:
                        products[code] = observation
                except (ValueError, OverflowError, decimal.InvalidOperation):
                    rejected += 1
                row.clear()
    return {'source': 'uci_online_retail', 'sourceUrl': 'https://doi.org/10.24432/C5BW33',
            'license': 'CC BY 4.0', 'sourceSha256': digest.hexdigest(),
            'attribution': 'Chen, D. (2015). Online Retail. UCI Machine Learning Repository.',
            'scanned': scanned, 'rejected': rejected,
            'products': sorted(products.values(), key=lambda p: p['productCode'])}

if __name__ == '__main__':
    try:
        print(json.dumps(extract(sys.argv[1]), ensure_ascii=True, allow_nan=False))
    except Exception as error:
        print('Importação UCI recusada: ' + str(error), file=sys.stderr)
        sys.exit(1)
