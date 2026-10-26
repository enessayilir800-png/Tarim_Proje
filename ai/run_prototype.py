"""Faz 0 prototipi: Malatya NDVI serilerinden sezon sınıfı ve rotasyon geçmişi.

Önce `python -m ai.ndvi_fetch`, sonra `python -m ai.run_prototype` çalıştır.
Çıktılar:
    data/malatya/ndvi/siniflandirma.csv   piksel-yıl bazında özellikler + sınıf
    data/malatya/ndvi/rotasyon_gecmisi.csv piksel bazında 5 yıllık rotasyon örüntüsü
    ai/figures/*.png                       sunum ve kontrol grafikleri
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

from ai.ndvi_fetch import OUT_DIR, SITES
from ai.phenology import CLASS_LABELS, CLASSES, classify_year, clean_series, rotation_history, year_features

FIG_DIR = Path(__file__).resolve().parent / "figures"
COLORS = {"erken_sezon": "#d4a72c", "yaz_sezonu": "#2f8f4e", "cift_urun": "#7b4fa0", "bahce": "#c0532d",
          "sabit_yesil": "#3a6f8f", "nadas_ciplak": "#b9b2a6", "belirsiz": "#e6e6e6"}
MONTH_LABELS = ["O", "Ş", "M", "N", "M", "H", "T", "A", "E", "E", "K", "A"]


def analyse_site(site: str) -> tuple[pd.DataFrame, np.ndarray]:
    with np.load(OUT_DIR / f"{site}.npz") as data:
        dates, ndvi, reliability = data["dates"], data["ndvi"], data["reliability"]
        lat, lon, nrows, ncols = data["lat"], data["lon"], int(data["nrows"]), int(data["ncols"])
    smooth = clean_series(dates, ndvi, reliability)
    years = np.array([int(d[:4]) for d in dates])
    months = np.array([int(d[5:7]) for d in dates])
    rows = []
    for year in sorted(set(years)):
        in_year = years == year
        for p in range(smooth.shape[1]):
            values = smooth[in_year, p]
            if not np.all(np.isfinite(values)):
                continue
            f = year_features(months[in_year], values)
            rows.append({"site": site, "pixel": p, "row": p // ncols, "col": p % ncols, "lat": round(float(lat[p]), 5),
                         "lon": round(float(lon[p]), 5), "year": int(year), "peak": round(f.peak, 3), "peak_month": f.peak_month,
                         "base": round(f.base, 3), "amplitude": round(f.amplitude, 3), "spring": round(f.spring, 3),
                         "summer": round(f.summer, 3), "winter": round(f.winter, 3), "season_days": f.season_days,
                         "early_peak": f.early_peak, "late_peak": f.late_peak, "class": classify_year(f),
                         **{f"m{m + 1:02d}": round(float(v), 3) for m, v in enumerate(f.monthly)}})
    return pd.DataFrame(rows), np.array([nrows, ncols])


def plot_class_profiles(df: pd.DataFrame) -> None:
    month_cols = [f"m{m:02d}" for m in range(1, 13)]
    fig, ax = plt.subplots(figsize=(9, 5))
    for cls in CLASSES:
        subset = df[df["class"] == cls]
        if len(subset) < 10:
            continue
        mean, q25, q75 = subset[month_cols].mean(), subset[month_cols].quantile(.25), subset[month_cols].quantile(.75)
        ax.plot(range(12), mean, color=COLORS[cls], lw=2.4, label=f"{CLASS_LABELS[cls]} (n={len(subset)})")
        ax.fill_between(range(12), q25, q75, color=COLORS[cls], alpha=.15)
    ax.set_xticks(range(12), MONTH_LABELS)
    ax.set_ylabel("NDVI")
    ax.set_title("Malatya: sezon sınıflarının ortalama NDVI eğrisi (MODIS 250 m, 2021-2025)")
    ax.legend(fontsize=8, frameon=False)
    ax.grid(alpha=.25)
    fig.tight_layout()
    fig.savefig(FIG_DIR / "sinif_profilleri.png", dpi=140)
    plt.close(fig)


def plot_site_maps(df: pd.DataFrame, shapes: dict[str, np.ndarray]) -> None:
    years = sorted(df["year"].unique())
    codes = {cls: i for i, cls in enumerate(CLASSES)}
    cmap = matplotlib.colors.ListedColormap([COLORS[c] for c in CLASSES])
    for site, (nrows, ncols) in shapes.items():
        subset = df[df["site"] == site]
        fig, axes = plt.subplots(1, len(years), figsize=(3 * len(years), 3.4))
        for ax, year in zip(np.atleast_1d(axes), years):
            grid = np.full((nrows, ncols), np.nan)
            in_year = subset[subset["year"] == year]
            for row, col, cls in zip(in_year["row"], in_year["col"], in_year["class"]):
                grid[row, col] = codes[cls]
            ax.imshow(grid, cmap=cmap, vmin=-.5, vmax=len(CLASSES) - .5, interpolation="nearest")
            ax.set_title(str(year)); ax.set_xticks([]); ax.set_yticks([])
        handles = [matplotlib.patches.Patch(color=COLORS[c], label=CLASS_LABELS[c]) for c in CLASSES]
        fig.legend(handles=handles, loc="lower center", ncol=4, fontsize=7, frameon=False)
        fig.suptitle(f"{site}: yıllara göre sezon sınıfı ({SITES[site]['not']})", fontsize=10)
        fig.tight_layout(rect=(0, .12, 1, .95))
        fig.savefig(FIG_DIR / f"harita_{site}.png", dpi=120)
        plt.close(fig)


def cluster_check(df: pd.DataFrame, k: int = 6) -> pd.DataFrame:
    """Kurallardan bağımsız KMeans: veride doğal gruplar kurallarla örtüşüyor mu?"""
    month_cols = [f"m{m:02d}" for m in range(1, 13)]
    model = KMeans(n_clusters=k, n_init=10, random_state=0).fit(df[month_cols].to_numpy())
    df["cluster"] = model.labels_
    fig, ax = plt.subplots(figsize=(9, 5))
    for c in range(k):
        dominant = df.loc[df["cluster"] == c, "class"].value_counts().idxmax()
        ax.plot(range(12), model.cluster_centers_[c], lw=2, color=COLORS[dominant],
                label=f"Küme {c} (n={(df['cluster'] == c).sum()}, çoğunluk: {dominant})")
    ax.set_xticks(range(12), MONTH_LABELS); ax.set_ylabel("NDVI"); ax.grid(alpha=.25)
    ax.set_title("Denetimsiz KMeans küme merkezleri (kurallardan bağımsız)")
    ax.legend(fontsize=8, frameon=False)
    fig.tight_layout(); fig.savefig(FIG_DIR / "kmeans_kumeler.png", dpi=140); plt.close(fig)
    return pd.crosstab(df["cluster"], df["class"])


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    frames, shapes = [], {}
    for site in SITES:
        if not (OUT_DIR / f"{site}.npz").exists():
            print(f"{site}: veri yok, önce python -m ai.ndvi_fetch çalıştır"); continue
        frame, shape = analyse_site(site)
        frames.append(frame); shapes[site] = shape
    df = pd.concat(frames, ignore_index=True)
    df.to_csv(OUT_DIR / "siniflandirma.csv", index=False)

    history = []
    for (site, pixel), group in df.sort_values("year").groupby(["site", "pixel"]):
        seq = group["class"].tolist()
        history.append({"site": site, "pixel": pixel, "lat": group["lat"].iloc[0], "lon": group["lon"].iloc[0],
                        "siniflar": "-".join(seq), **rotation_history(seq)})
    history_df = pd.DataFrame(history)
    history_df.to_csv(OUT_DIR / "rotasyon_gecmisi.csv", index=False)

    # Ziraat ekibinin uydu görüntüsü / saha bilgisiyle etiketleyeceği tabakalı örneklem -> doğruluk ölçümü
    sample_year = int(df["year"].max())
    sample = pd.concat([g.sample(min(len(g), 10), random_state=0)
                        for _, g in df[df["year"] == sample_year].groupby("class")])
    sample = sample.sample(frac=1, random_state=1).reset_index(drop=True)
    sample.insert(0, "ornek_id", [f"D{i + 1:03d}" for i in range(len(sample))])
    # Etiketleyen kişi modelin cevabını görmesin (kör etiketleme); cevap anahtarı ayrı dosyada.
    sample[["ornek_id", "site", "pixel", "year", "class"]].rename(columns={"class": "model_sinifi"}).to_csv(
        OUT_DIR / "dogrulama_anahtar.csv", index=False, encoding="utf-8-sig")
    blind = sample[["ornek_id", "lat", "lon", "year"]].copy()
    blind["harita"] = [f"https://www.google.com/maps/@{la},{lo},600m/data=!3m1!1e3" for la, lo in zip(blind["lat"], blind["lon"])]
    blind["uzman_sinifi"] = ""
    blind["not"] = ""
    blind.to_csv(OUT_DIR / "dogrulama_ornekleri.csv", index=False, encoding="utf-8-sig")

    plot_class_profiles(df)
    plot_site_maps(df, shapes)
    crosstab = cluster_check(df)

    pd.set_option("display.width", 200); pd.set_option("display.max_columns", 20)
    print(f"\nToplam {len(df)} piksel-yıl, {df[['site', 'pixel']].drop_duplicates().shape[0]} piksel\n")
    print("Sınıf dağılımı (alan bazında, %):")
    print((pd.crosstab(df["site"], df["class"], normalize="index") * 100).round(1))
    print("\nRotasyon örüntüsü (piksel bazında, %):")
    print((pd.crosstab(history_df["site"], history_df["pattern"], normalize="index") * 100).round(1))
    print("\nKMeans küme x kural sınıfı:")
    print(crosstab)


if __name__ == "__main__":
    main()
