"""Planilha sintética mínima para testar o importador, sem dados de pessoas."""
import datetime as dt
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
rows = [
 ['InvoiceNo','StockCode','Description','Quantity','InvoiceDate','UnitPrice','CustomerID','Country'],
 ['100001','10001','Primeiro nome','1','40513','1.25','TEST','Test'],
 ['100002','10001','Nome mais recente','2','40514','2.50','TEST','Test'],
 ['C100003','10001','Cancelado','1','40515','99.00','TEST','Test'],
 ['100004','10002','Sem preço','1','40513','0','TEST','Test'],
 ['100005','10003','Devolução','-1','40513','2','TEST','Test'],
 ['100006','10004','','1','40513','2','TEST','Test'],
 ['100007','10005','Data fora da base','1','50000','2','TEST','Test'],
 ['100008','10006','Outro produto','1','40513','3.33','TEST','Test'],
 ['100009','POST','Postagem','1','40513','1','TEST','Test'],
]
root=ET.Element('{'+NS+'}worksheet')
sheet=ET.SubElement(root,'{'+NS+'}sheetData')
for index,values in enumerate(rows,1):
 row=ET.SubElement(sheet,'{'+NS+'}row',r=str(index))
 for column,value in enumerate(values):
  cell=ET.SubElement(row,'{'+NS+'}c',r=chr(65+column)+str(index),t='inlineStr')
  ET.SubElement(ET.SubElement(cell,'{'+NS+'}is'),'{'+NS+'}t').text=value
with zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED) as book:
 book.writestr('xl/worksheets/sheet1.xml',ET.tostring(root,encoding='utf-8'))
