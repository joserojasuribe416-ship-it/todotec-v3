from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..database import get_db
from ..models import Sale, SaleItem, Product, ProductVariant, Purchase, CapitalContribution, AccountingEntry
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    def sales_in_period(start):
        return db.query(func.sum(Sale.total)).filter(Sale.sale_date >= start).scalar() or 0

    # Sales metrics
    sales_today = sales_in_period(today_start)
    sales_week = sales_in_period(week_start)
    sales_month = sales_in_period(month_start)
    sales_year = sales_in_period(year_start)

    # Inventory
    total_inventory_value = 0
    low_stock_products = []
    products = db.query(Product).filter(Product.is_active == True).all()
    for p in products:
        stock = sum(v.stock for v in p.variants)
        cost = p.unit_cost
        total_inventory_value += stock * cost
        if stock <= 3 and stock >= 0:
            low_stock_products.append({
                "id": p.id, "name": p.name, "sku": p.sku,
                "stock": stock, "category": p.category
            })

    # Top products
    top_products_raw = db.query(
        Product.id,
        Product.name,
        Product.category,
        func.sum(SaleItem.quantity).label("qty_sold"),
        func.sum(SaleItem.subtotal).label("revenue"),
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .group_by(Product.id)\
     .order_by(func.sum(SaleItem.quantity).desc())\
     .limit(5).all()

    top_products = [
        {"id": r.id, "name": r.name, "category": r.category,
         "qty_sold": r.qty_sold or 0, "revenue": round(r.revenue or 0, 2)}
        for r in top_products_raw
    ]

    # Monthly sales trend (last 6 months)
    monthly_sales = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        ms = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if d.month == 12:
            me = d.replace(year=d.year + 1, month=1, day=1)
        else:
            me = d.replace(month=d.month + 1, day=1)
        total = db.query(func.sum(Sale.total)).filter(
            Sale.sale_date >= ms, Sale.sale_date < me
        ).scalar() or 0
        monthly_sales.append({
            "month": ms.strftime("%b %Y"),
            "sales": round(total, 2)
        })

    # Sales by category
    category_sales = db.query(
        Product.category,
        func.sum(SaleItem.subtotal).label("revenue")
    ).join(SaleItem, SaleItem.product_id == Product.id)\
     .group_by(Product.category)\
     .all()
    by_category = [{"category": r.category or "Sin categoría", "revenue": round(r.revenue or 0, 2)}
                   for r in category_sales]

    # Financial summary
    capital = db.query(func.sum(CapitalContribution.amount)).scalar() or 0
    cash_in = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.debit_account == "Efectivo"
    ).scalar() or 0
    cash_out = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.credit_account == "Efectivo"
    ).scalar() or 0
    cash = max(cash_in - cash_out, 0)

    cogs = db.query(func.sum(AccountingEntry.amount)).filter(
        AccountingEntry.entry_type == "cogs"
    ).scalar() or 0
    gross_profit = (db.query(func.sum(Sale.total)).scalar() or 0) - cogs

    return {
        "sales": {
            "today": round(sales_today, 2),
            "week": round(sales_week, 2),
            "month": round(sales_month, 2),
            "year": round(sales_year, 2),
        },
        "inventory": {
            "total_value": round(total_inventory_value, 2),
            "low_stock": low_stock_products,
            "total_products": len(products),
        },
        "top_products": top_products,
        "monthly_sales": monthly_sales,
        "by_category": by_category,
        "finance": {
            "cash": round(cash, 2),
            "capital": round(capital, 2),
            "gross_profit": round(gross_profit, 2),
        }
    }
