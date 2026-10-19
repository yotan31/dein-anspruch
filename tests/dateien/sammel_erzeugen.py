from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import sys
out=sys.argv[1]
c=canvas.Canvas(out,pagesize=A4); W,H=A4
def page(lines):
    y=H-60
    for l in lines:
        size=14 if l.startswith("#") else 11
        c.setFont("Helvetica-Bold" if l.startswith("#") else "Helvetica", size)
        c.drawString(50,y,l.lstrip("#")); y-=20
    c.showPage()
page(["#Löwen-Apotheke am Markt","Marktplatz 3, 70173 Stuttgart","Quittung","Datum: 14.03.2024","Ibuprofen 400 PZN 01234567  Zuzahlung 5,00 EUR","Metformin PZN 07654321  Zuzahlung 5,00 EUR","Summe Zuzahlung: 10,00 EUR","Gesamtbetrag 23,47 EUR"])
page(["#Alltagshilfe Sonnenschein GmbH","Rechnung Nr. AH-2025-118","Rechnungsdatum: 31.01.2025","Leistungen nach § 45b SGB XI (Entlastungsbetrag)","Leistungszeitraum 01.01.2025 - 31.01.2025","Haushaltshilfe 4 Std. a 32,50 EUR   130,00","Gesamtbetrag: 130,00 EUR","Zahlbar bis 14.02.2025"])
page(["#Pflegedienst Mobil e.V.","Rechnung Nr. PD-77","Datum 12.06.2025","Verhinderungspflege nach § 39 SGB XI","Seite 1 von 2","Einsatz 05.06.2025 bis 11.06.2025"])
page(["Rechnung Nr. PD-77","Seite 2 von 2","Stunden 22 x 31,00 EUR","Rechnungsbetrag 682,00 EUR"])
page(["#Taxi Müller Stuttgart","Fahrtquittung","vom 3. Februar 2026","Krankenfahrt zur Dialyse","Eigenanteil 10,00 €"])
page(["#Physiotherapie Lindner","Rechnung","Datum: 20.04.2026","Krankengymnastik 6x","Zuzahlung gesamt 31,80 €"])
c.save()
