select
    cast(m as date) as month,
    year(m) as year,
    quarter(m) as quarter,
    month(m) as month_number,
    strftime(m, '%b') as month_name
from range(date '2007-01-01', date_trunc('month', current_date) + interval 1 month, interval 1 month) t(m)
