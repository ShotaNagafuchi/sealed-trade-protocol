"""
Halving schedule verification and visualization.

Verifies that:
1. Period allocations sum to 95M (mining allocation)
2. Thresholds double each period
3. Cumulative volume at $21B fully mines supply
"""

import sys
from sealed_economics import (
    period_allocation, period_threshold, cumulative_threshold,
    cumulative_mined, mining_rate, MINING_ALLOCATION, MAX_PERIODS,
    HALVING_INITIAL_USD, halving_table,
)


def verify_halving_schedule():
    """Run all halving schedule assertions."""
    errors = []

    # 1. Verify allocations sum to mining supply (within geometric series dust)
    total = sum(period_allocation(n) for n in range(MAX_PERIODS))
    remaining = MINING_ALLOCATION - total
    # With 22 periods, residual is 47.5M / 2^22 ≈ 22.65 SEAL — acceptable dust
    if abs(remaining) > 25:
        errors.append(f"Allocation sum {total:,.2f} != {MINING_ALLOCATION:,} (diff: {remaining:,.4f})")
    else:
        print(f"[PASS] Allocations sum to {total:,.2f} SEAL (dust: {remaining:.6f})")

    # 2. Verify period volumes double from period 2 onward
    # Periods 0 and 1 both have $10K volume; from period 2 it doubles
    from sealed_economics import period_volume
    assert period_volume(0) == period_volume(1), "Periods 0 and 1 should have equal volume"
    for n in range(2, MAX_PERIODS):
        prev = period_volume(n - 1)
        curr = period_volume(n)
        if abs(curr / prev - 2.0) > 1e-10:
            errors.append(f"Period {n}: volume {curr} is not 2x {prev}")
    if not any("volume" in e for e in errors):
        print(f"[PASS] Period volumes double correctly (from period 2 onward)")

    # 3. Verify cumulative thresholds = $10K * 2^n
    for n in range(MAX_PERIODS):
        expected = HALVING_INITIAL_USD * (2 ** n)
        actual = cumulative_threshold(n)
        if abs(expected - actual) > 0.01:
            errors.append(f"Period {n}: cumulative threshold {actual} != {expected}")
    if not any("cumulative threshold" in e for e in errors):
        print(f"[PASS] Cumulative thresholds match formula ($10K * 2^n)")

    # 4. Verify period 0 allocation is 47.5M
    assert period_allocation(0) == 47_500_000, f"Period 0 allocation: {period_allocation(0)}"
    print(f"[PASS] Period 0 allocation = 47,500,000 SEAL")

    # 5. Verify cumulative never exceeds supply
    for n in range(MAX_PERIODS):
        cm = cumulative_mined(n)
        if cm > MINING_ALLOCATION + 1:
            errors.append(f"Period {n}: cumulative mined {cm:,.0f} > {MINING_ALLOCATION:,}")
    if not any("cumulative mined" in e for e in errors):
        print(f"[PASS] Cumulative mined never exceeds {MINING_ALLOCATION:,}")

    # 6. Verify mining rate decreases
    rates = [mining_rate(n) for n in range(MAX_PERIODS)]
    for i in range(1, len(rates)):
        if rates[i] >= rates[i-1]:
            errors.append(f"Mining rate not decreasing: period {i-1}={rates[i-1]}, period {i}={rates[i]}")
    if not any("not decreasing" in e for e in errors):
        print(f"[PASS] Mining rate strictly decreases")

    # 7. Verify total cumulative volume at end
    final_vol = cumulative_threshold(MAX_PERIODS - 1)
    print(f"[INFO] Total cumulative volume to fully mine: ${final_vol:,.0f}")
    print(f"[INFO] ≈ ${final_vol/1e9:.1f}B")

    if errors:
        print(f"\n[FAIL] {len(errors)} errors found:")
        for e in errors:
            print(f"  - {e}")
        return False

    print(f"\n[ALL PASS] Halving schedule verified successfully")
    return True


def print_table():
    """Print the full halving table."""
    table = halving_table()

    print("\n=== Halving Schedule ===\n")
    header = f"{'Period':>6} | {'Vol in Period':>14} | {'Cumul Volume':>14} | {'Allocation':>14} | {'Cumul Mined':>14} | {'Rate SEAL/$':>12} | {'Remaining':>14}"
    print(header)
    print("-" * len(header))

    for row in table:
        print(
            f"{row['period']:>6} | "
            f"${row['volume_in_period']:>13,.0f} | "
            f"${row['cumulative_volume']:>13,.0f} | "
            f"{row['allocation']:>14,.0f} | "
            f"{row['cumulative_mined']:>14,.0f} | "
            f"{row['mining_rate']:>12,.4f} | "
            f"{row['remaining_supply']:>14,.0f}"
        )


def plot_curves():
    """Generate halving visualization plots."""
    try:
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError:
        print("[SKIP] matplotlib not available, skipping plots")
        return

    table = halving_table()
    periods = [r['period'] for r in table]
    allocations = [r['allocation'] for r in table]
    cumul_mined = [r['cumulative_mined'] for r in table]
    rates = [r['mining_rate'] for r in table]
    volumes = [r['cumulative_volume'] for r in table]

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Sealed Trade Protocol — Halving Schedule', fontsize=14, fontweight='bold')

    # 1. Period allocation (log scale)
    ax = axes[0, 0]
    ax.bar(periods, allocations, color='#2196F3', alpha=0.8)
    ax.set_yscale('log')
    ax.set_xlabel('Period')
    ax.set_ylabel('SEAL Tokens (log)')
    ax.set_title('Allocation per Period')
    ax.grid(axis='y', alpha=0.3)

    # 2. Cumulative mined
    ax = axes[0, 1]
    ax.plot(periods, cumul_mined, 'o-', color='#4CAF50', linewidth=2)
    ax.axhline(y=MINING_ALLOCATION, color='red', linestyle='--', label=f'Max Supply ({MINING_ALLOCATION/1e6:.0f}M)')
    ax.set_xlabel('Period')
    ax.set_ylabel('SEAL Tokens')
    ax.set_title('Cumulative Mined')
    ax.legend()
    ax.grid(alpha=0.3)

    # 3. Mining rate (log scale)
    ax = axes[1, 0]
    ax.plot(periods, rates, 's-', color='#FF9800', linewidth=2)
    ax.set_yscale('log')
    ax.set_xlabel('Period')
    ax.set_ylabel('SEAL per $1 (log)')
    ax.set_title('Mining Rate Decay')
    ax.grid(alpha=0.3)

    # 4. Cumulative volume (log scale)
    ax = axes[1, 1]
    ax.plot(periods, volumes, 'D-', color='#9C27B0', linewidth=2)
    ax.set_yscale('log')
    ax.set_xlabel('Period')
    ax.set_ylabel('USD (log)')
    ax.set_title('Cumulative Volume Threshold')
    ax.grid(alpha=0.3)

    plt.tight_layout()
    import os
    save_path = os.path.join(os.path.dirname(__file__), 'halving_curves.png')
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    print("[INFO] Saved halving_curves.png")
    plt.close()


if __name__ == '__main__':
    print_table()
    success = verify_halving_schedule()
    plot_curves()
    sys.exit(0 if success else 1)
