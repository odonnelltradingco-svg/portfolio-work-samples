"""Three focused descriptive figures from the cleaned, fictional orders."""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter, MaxNLocator
import numpy as np

INK = '#153b36'
GREEN = '#337568'
BLUE = '#7591b0'
GOLD = '#b28a43'


def make_charts(result, destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10,
                         'axes.spines.top': False, 'axes.spines.right': False,
                         'axes.labelcolor': INK, 'text.color': INK, 'axes.titleweight': 'bold',
                         'figure.facecolor': '#fbfcf9', 'axes.facecolor': '#fbfcf9'})
    paths = []
    status = result['status']
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.1), layout='constrained')
    colors = [GREEN, GOLD, BLUE]
    bars = axes[0].bar(status.index.str.title(), status.orders, color=colors, width=.55)
    axes[0].bar_label(bars, padding=5)
    axes[0].set(ylabel='Accepted orders', title='Records retained by status', ylim=(0, status.orders.max()*1.22))
    axes[0].yaxis.set_major_locator(MaxNLocator(integer=True))
    bars = axes[1].bar(status.index.str.title(), status.value_cents/100, color=colors, width=.55)
    axes[1].bar_label(bars, labels=[f'${v/100:,.2f}' for v in status.value_cents], padding=5)
    axes[1].set(ylabel='Order value (USD)', title='Paid, pending and refunded stay separate', ylim=(0, status.value_cents.max()/100*1.23))
    axes[1].yaxis.set_major_formatter(FuncFormatter(lambda x, _: f'${x:,.0f}'))
    fig.suptitle('01 / RECONCILE BEFORE SUMMARIZING', fontsize=11, color=GREEN)
    path = destination/'status-reconciliation.png'; fig.savefig(path, dpi=150); plt.close(fig); paths.append(path)

    paid = result['paid']
    values = paid.order_value_cents.to_numpy()/100
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.1), layout='constrained')
    max_value = values.max()
    use_log = values.min() > 0 and max_value / values.min() > 20
    bins = np.geomspace(values.min()*.99, max_value*1.01, 16) if use_log else np.linspace(0, max(1, max_value*1.01), 16)
    axes[0].hist(values, bins=bins, color=GREEN, alpha=.85, edgecolor='#fbfcf9')
    if use_log:
        axes[0].set_xscale('log')
    axes[0].axvline(np.median(values), color=GOLD, linewidth=2, label=f'Median ${np.median(values):,.2f}')
    axes[0].axvline(np.mean(values), color=BLUE, linewidth=2, linestyle='--', label=f'Mean ${np.mean(values):,.2f}')
    axes[0].set(title='All valid paid values remain visible', ylabel='Paid orders', xlabel='Order value (USD; logarithmic scale)' if use_log else 'Order value (USD)')
    axes[0].xaxis.set_major_formatter(FuncFormatter(lambda x, _: f'${x:,.0f}'))
    axes[0].legend(frameon=False, fontsize=8)
    daily = result['daily']
    axes[1].plot(daily.index, daily.paid_value_cents/100, color=GREEN, marker='o', markersize=3, linewidth=1.5)
    axes[1].set(title='Daily paid value, including the extreme order', ylabel='Paid order value (USD)', xlabel='August 2026; zero-value days retained')
    axes[1].yaxis.set_major_formatter(FuncFormatter(lambda x, _: f'${x:,.0f}'))
    from matplotlib.dates import DateFormatter, DayLocator
    axes[1].xaxis.set_major_locator(DayLocator(interval=7)); axes[1].xaxis.set_major_formatter(DateFormatter('%b %d'))
    fig.suptitle('02 / AN EXTREME VALUE CHANGES THE STORY', fontsize=11, color=GREEN)
    path = destination/'paid-values.png'; fig.savefig(path, dpi=150); plt.close(fig); paths.append(path)

    channels = result['channels']
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.1), layout='constrained')
    y = np.arange(len(channels))
    axes[0].barh(y, channels.shipping_observations, color=GREEN, label='Observed')
    axes[0].barh(y, channels.missing_shipping, left=channels.shipping_observations, color=GOLD, label='Missing')
    for i, row in enumerate(channels.itertuples()):
        axes[0].text(row.orders+1, i, f'{row.shipping_observations}/{row.orders}', va='center', fontsize=9)
    axes[0].set(yticks=y, yticklabels=channels.index, title='Shipping coverage among paid orders', xlabel='Paid orders; labels show observed / total', xlim=(0, max(1, channels.orders.max())*1.28))
    axes[0].xaxis.set_major_locator(MaxNLocator(integer=True)); axes[0].legend(frameon=False, fontsize=8)
    axes[0].invert_yaxis()
    axes[1].scatter(channels.median_shipping_days, y, s=75, color=GREEN, zorder=3)
    for i, row in enumerate(channels.itertuples()):
        if np.isfinite(row.median_shipping_days):
            axes[1].text(row.median_shipping_days+.22, i, f'{row.median_shipping_days:.1f} days (n={row.shipping_observations})', va='center', fontsize=9)
    medmax = channels.median_shipping_days.max()
    axes[1].set(yticks=y, yticklabels=channels.index, title='Median among observed shipping times', xlabel='Days to ship; missing times excluded', xlim=(0, max(1, medmax if np.isfinite(medmax) else 1)*1.65))
    axes[1].invert_yaxis(); axes[1].grid(axis='x', alpha=.15)
    fig.suptitle('03 / SHOW THE DENOMINATOR WITH THE COMPARISON', fontsize=11, color=GREEN)
    path = destination/'shipping-coverage.png'; fig.savefig(path, dpi=150); plt.close(fig); paths.append(path)
    return paths
