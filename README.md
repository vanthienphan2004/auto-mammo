# AutoMammo

**Density & BI-RADS–Aware Triage and Report Generation (DB-ATRG)**

AutoMammo fine-tunes [MedGemma 1.5 4B-it](https://ai.google.dev/gemma/docs/medgemma) to write a structured mammography report from a single 2D mammogram view. It then reads two values from that report, **ACR breast density** and **BI-RADS category**, and uses them to reorder a screening worklist so the most urgent cases are read first.

> [!WARNING]
> This is research code. It is not a medical device and must not be used to make clinical decisions.

---

## Quick Start

There are two ways to try the project:

- **See the triage method without data or a GPU:** run notebook 5 on its built-in synthetic cases. It takes a few minutes. See [Try the Triage Simulation Without Data](#try-the-triage-simulation-without-data).
- **Run the full pipeline:** download the datasets, fine-tune MedGemma, and run the triage on the model's own predictions. Follow these steps:
  1. [Check what you need](#1-check-what-you-need)
  2. [Download the datasets](#2-download-the-datasets)
  3. [Set up your Google Drive folder](#3-set-up-your-google-drive-folder)
  4. [Set up HuggingFace access](#4-set-up-huggingface-access)
  5. [Run the notebooks](#5-run-the-notebooks)
  6. [Read the results](#6-read-the-results)

---

## How the Triage Works

Screening mammograms are usually read first-in, first-out (FIFO). That order ignores how difficult or how urgent each case is. In dense breast tissue, lesions can be hidden ("masking"), which raises the risk of a late or missed diagnosis.

DB-ATRG estimates density and BI-RADS from the mammogram before a radiologist reads it, then reorders the worklist in two phases:

- **Phase I — Density flagging:** exams predicted as **ACR D** (extremely dense tissue) are pulled out for complexity routing: specialist review and supplemental screening such as ultrasound or MRI.
- **Phase II — Urgency ranking:** the remaining exams are sorted by an urgency score:

  $$
  S = \sum_{i=1}^{N} (B_i)^k + D
  $$

  where:

  - $B_i \in \{1, 2, 3, 4, 5\}$ is the $i$-th distinct BI-RADS category listed on the report's `BI-RADS:` line,
  - $N$ is the number of distinct categories on that line (two BI-RADS 4 masses count once; a normal `BI-RADS: 1` report has $N = 1$),
  - $k$ is the severity exponent (default $k = 2$),
  - $D$ is the numeric ACR density value ($A=1, B=2, C=3$).

Higher scores move to the front of the queue, so high-risk cases (BI-RADS 4/5) are read sooner.

---

## 1. Check What You Need

| You need | Used for | Notes |
| :-- | :-- | :-- |
| Google account with Google Drive | Storing the data, intermediate files, and results | All notebooks read and write under `MyDrive/MedGemma2026/main/`. |
| Google Colab with an A100 GPU | Notebook 4 (training and evaluation) | A100 runtimes need a paid Colab plan (Pro, Pro+, or pay-as-you-go compute units). Notebooks 1–3 and 5 run on a free CPU runtime. |
| HuggingFace account | Downloading MedGemma and uploading your fine-tuned adapter | You accept the model's terms and create a token in [step 4](#4-set-up-huggingface-access). |
| PhysioNet credentialed account | VinDr-Mammo annotation files | Credentialing includes a short training course and is reviewed by hand, so **apply first**. |
| Kaggle account | VinDr-Mammo images | |

DMID is public and needs no account.

---

## 2. Download the Datasets

Neither dataset is redistributed in this repository. Download them from their official sources.

### DMID (Digital Mammography Imaging Dataset)

- **Source:** [Figshare (doi:10.6084/m9.figshare.24522883.v2)](https://doi.org/10.6084/m9.figshare.24522883.v2)
- **Contents:** 510 mammograms with free-text diagnostic reports written by radiologists.
- **Download:** the full-resolution `.tif` / `.tiff` images and the `.txt` reports.

### VinDr-Mammo

- **Contents:** 20,000 mammogram views across 5,000 studies, annotated for breast density and findings.
- **Annotations:** [PhysioNet (VinDr-Mammo v1.0.0)](https://physionet.org/content/vindr-mammo/1.0.0/). Once you are credentialed and have signed the dataset's data use agreement, download only `breast-level_annotations.csv` and `finding_annotations.csv`. You do not need PhysioNet's DICOM images; the full set is very large.
- **Images:** [Kaggle (vindr-mammogram-dataset-dicom-to-png)](https://www.kaggle.com/datasets/shantanughosh/vindr-mammogram-dataset-dicom-to-png), the Mammo-CLIP release of preprocessed 8-bit PNGs (breast-extracted and normalized), one folder per study: `<study_id>/<image_id>.png`.

> [!TIP]
> The images are a large download. The Kaggle CLI (`kaggle datasets download -d shantanughosh/vindr-mammogram-dataset-dicom-to-png`) can download them straight into a Colab runtime, so you don't have to upload them from your computer. Check the unzipped folder layout, then move the study folders into `data/vindr-mammo/images-processed/`.

---

## 3. Set Up Your Google Drive Folder

Create the folder `MyDrive/MedGemma2026/main/` in Google Drive. Put the files you downloaded, plus the prompt config from this repository, where the tree says **you add**. The notebooks create everything marked *generated*.

```text
MedGemma2026/main/
├── config/
│   └── prompts-cot-zeroshot.yaml          ← you add: copy from this repo's config/
├── data/
│   ├── dmid/
│   │   ├── images-original/               ← you add: DMID .tif / .tiff images
│   │   ├── reports-original/              ← you add: DMID .txt reports
│   │   ├── images-processed/                generated by notebook 1
│   │   └── reports-processed/               generated by notebook 2
│   ├── vindr-mammo/
│   │   ├── breast-level_annotations.csv   ← you add: from PhysioNet
│   │   ├── finding_annotations.csv        ← you add: from PhysioNet
│   │   ├── images-processed/              ← you add: Kaggle PNGs as <study_id>/<image_id>.png
│   │   └── reports/                         generated by notebook 2
│   └── split/                               generated by notebook 3
└── results/                                 generated by notebooks 4 and 5
```

> [!TIP]
> To use a different folder, change `ROOT_DIR` in all five notebooks. It is set in the cell right after the Drive mount.

---

## 4. Set Up HuggingFace Access

1. Sign in to HuggingFace and accept the terms on the [google/medgemma-1.5-4b-it](https://huggingface.co/google/medgemma-1.5-4b-it) model page.
2. Create an access token with **write** permission (HuggingFace **Settings → Access Tokens**). Use the same account that accepted the terms. Write access is required because notebook 4 uploads your fine-tuned adapter; a read-only token fails as soon as training starts.
3. In Colab, open **Secrets** (the key icon in the left sidebar), add a secret named `HF_TOKEN` with your token, and turn on notebook access.

> [!NOTE]
> Notebook 4 uploads the trained LoRA adapter to your account as `medgemma-1.5-4b-it-sft-lora-dmid-vindr`. New HuggingFace repos are public by default. To keep yours private, set `hub_private_repo=True` in `SFTConfig` in notebook 4.

---

## 5. Run the Notebooks

Open each notebook in Colab from the table below, set the runtime (**Runtime → Change runtime type**), and choose **Run all**. Run them in order, because each notebook reads what the previous one wrote. To keep your own edits, use **File → Save a copy in Drive**.

| # | Notebook | Open | Runtime | What it does | How to check it worked |
| :-: | :-- | :-: | :-- | :-- | :-- |
| 1 | `medgemma-image-processing.ipynb` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vanthienphan2004/auto-mammo/blob/main/notebooks/medgemma-image-processing.ipynb) | CPU | Converts the DMID TIFFs into PNGs in the Mammo-CLIP format | The last line prints `processed=… skipped(existing)=…`, and `data/dmid/images-processed/` fills with PNGs |
| 2 | `medgemma-report-processing.ipynb` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vanthienphan2004/auto-mammo/blob/main/notebooks/medgemma-report-processing.ipynb) | CPU | Rewrites the DMID reports and builds VinDr reports in one shared format | Prints `Reformatted N DMID reports` and `Wrote N VinDr reports` |
| 3 | `medgemma-split.ipynb` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vanthienphan2004/auto-mammo/blob/main/notebooks/medgemma-split.ipynb) | CPU | Pairs images with reports and builds the train / validation / test splits | The last line prints the split sizes; validation and test have about 1,000 records each |
| 4 | `medgemma-train-eval.ipynb` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vanthienphan2004/auto-mammo/blob/main/notebooks/medgemma-train-eval.ipynb) | **A100 GPU, High-RAM** | Fine-tunes MedGemma, then generates and scores reports for the test split | Prints the metrics, then `Saved:` with three files in `results/` |
| 5 | `aware-triage-method.ipynb` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/vanthienphan2004/auto-mammo/blob/main/notebooks/aware-triage-method.ipynb) | CPU | Runs the triage simulation on the model's predictions | Prints `Plot saved -> …/eval_predictions_100_2/100-2-analysis.png` |

Good to know:

- Notebooks 1–4 mount Google Drive with `google.colab`, so they only run in Colab. Notebook 5 also runs on your own machine.
- Notebook 1 skips images it has already converted, so it is safe to re-run. Notebooks 2 and 3 overwrite their outputs.
- Notebook 4 installs `bitsandbytes`, `evaluate`, `rouge-score`, `trl`, and `peft`. Everything else it needs comes preinstalled on Colab.
- Notebook 4 was run on an A100 with High-RAM. It trains in bf16 with a per-device batch size of 8 and fully trains the embedding and output layers. Smaller GPUs (such as T4 or V100) are untested and have no native bf16 support.
- If notebook 5 writes to `results/100-2/` instead of `results/eval_predictions_100_2/`, it did not find `results/eval_predictions.jsonl` and used synthetic cases. Run notebook 4 first.

---

## 6. Read the Results

| File (under `results/`) | What it contains |
| :-- | :-- |
| `eval_metrics.json` | All test-set metrics. Text generation: ROUGE, BLEU-1 to BLEU-4, METEOR, and word-level F1. For BI-RADS and ACR density: accuracy, macro-F1, and balanced accuracy, each with a 95% bootstrap confidence interval. |
| `eval_output.txt` | For each test image, the reference report next to the generated report, plus the predicted BI-RADS and ACR density with the model's confidence. The easiest file to read by eye. |
| `eval_predictions.jsonl` | One JSON object per test image: `image_id`, `image_path`, the generated `text`, the reference `ref`, and the closed-set probabilities for `acr` and `birads` (`pred`, `conf`, `dist`). Notebook 5 reads this file. |
| `eval_predictions_100_2/` | Notebook 5 outputs. `100-2-random_cases.csv` is the FIFO order and `100-2-treated_cases.csv` the DB-ATRG order. `100-2-phase1_acr_d.csv` lists the ACR D cases pulled out in Phase I. `100-2-merged_analysis.csv` has both ranks and the rank shift for each case. `100-2-analysis.png` is a five-panel summary figure. The `100-2` prefix is the sample size and the random seed. |

- BI-RADS scores compare the whole `BI-RADS:` line, so a reference of `3, 5` counts as correct only if the prediction is also exactly `3, 5`.
- The trained adapter is saved on the HuggingFace Hub. Training checkpoints and the loss plot (`loss_curve_by_epoch.png`) are written to the Colab runtime's local disk, which is erased when the runtime ends. Download them if you need them.

---

## Try the Triage Simulation Without Data

If notebook 5 cannot find `eval_predictions.jsonl`, it generates 100 synthetic cases instead. Each case has one to three findings, with BI-RADS and density drawn from an assumed screening-population prevalence. You can use this to see the whole triage method without datasets, training, or a GPU.

**In Colab:** open notebook 5 from the [table above](#5-run-the-notebooks) and choose **Run all**. It asks to mount your Drive and saves the results to `MyDrive/MedGemma2026/main/results/100-2/`.

**On your own machine** (Python 3.10 or newer):

```bash
git clone https://github.com/vanthienphan2004/auto-mammo.git
cd auto-mammo
pip install numpy pandas "matplotlib>=3.9" jupyter
jupyter notebook notebooks/aware-triage-method.ipynb
```

Choose **Run all**. You will see `Predictions file not found`, followed by `Running simulation with synthetic cases`; that is expected. Results are saved to `results/100-2/` in the repository. To simulate your own model's predictions locally instead, copy `eval_predictions.jsonl` into `results/` and run it again.

---

## Customizing

- **Check the pipeline quickly on less data:** in notebook 3, set `SAMPLE_PER_SOURCE` (for example to `100`) to use only that many records per dataset. The resulting splits are too small to give meaningful metrics; use this only to check that every notebook runs end to end.
- **Rename or hide the uploaded adapter:** change `HUB_MODEL_ID` or set `hub_private_repo=True` in notebook 4.
- **GPU runs out of memory:** in notebook 4, lower `per_device_train_batch_size` and raise `gradient_accumulation_steps` so that their product stays 256 (for example 4 × 64).
- **Change the prompt:** edit `zero_shot.system` and `zero_shot.user_instruction` in `config/prompts-cot-zeroshot.yaml`. The file also contains a `chain_of_thought` prompt, which notebook 4 does not use.
- **Change the triage simulation** (notebook 5):
  - `run_simulation(k=100, seed=2)` sets the number of sampled cases and the random seed.
  - `BIRADS_K` is the severity exponent $k$ in the urgency score.
  - `weight_mode` in `run_simulation` controls how cases are sampled: `additive` (default), `birads_only`, or `product`.
  - `filter_correct` in `load_cases_from_jsonl` (default `True`) keeps only correctly predicted cases. Set it to `False` to simulate on every prediction, including wrong ones.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| :-- | :-- | :-- |
| Error about a gated repo when notebook 4 loads the model | The MedGemma terms were not accepted on the token's account | Accept the terms on the model page with the same account ([step 4](#4-set-up-huggingface-access)) |
| Permission error about creating a repo as soon as training starts | The token is read-only | Create a token with write access and update the `HF_TOKEN` secret |
| `FileNotFoundError: Prompt config not found` | The prompt file is missing from Drive | Copy `config/prompts-cot-zeroshot.yaml` from this repo to `MedGemma2026/main/config/` |
| Notebook 1 prints `DMID .tif images to process: 0` | The TIFFs are not in the expected folder | Put them directly in `data/dmid/images-original/` |
| Notebook 3 prints `Skipping source ... not found` | Notebook 2 has not run, or `ROOT_DIR` points somewhere else | Run notebook 2 and check `ROOT_DIR` |
| Notebook 4 fails to open an image file | An image is not where notebook 3 expects it | Check that notebook 1 finished and that VinDr PNGs sit at `data/vindr-mammo/images-processed/<study_id>/<image_id>.png` |
| CUDA out of memory in notebook 4 | The GPU is smaller than an A100, or High-RAM is off | See **GPU runs out of memory** under [Customizing](#customizing) |
| Notebook 5 writes to `results/100-2/` | It did not find `results/eval_predictions.jsonl` and used synthetic cases | Run notebook 4 first, or copy the predictions file into `results/` |

---

## How the Pipeline Works

### 1. `medgemma-image-processing.ipynb`

- **Purpose:** Converts the raw DMID TIFF images to the Mammo-CLIP image format that the VinDr PNGs already use.
- **Operations:** Crops a 5-pixel border, rescales intensity to the full 8-bit range $[0, 255]$, crops to the breast region (`ExtractBreast`), and resizes to $912 \times 1520$.
- **Output:** PNGs in `data/dmid/images-processed/`. VinDr-Mammo images are already in this format and skip this step.

### 2. `medgemma-report-processing.ipynb`

- **Purpose:** Turns the free-text DMID reports and the VinDr-Mammo label files into one machine-readable report format:

  ```text
  Breast Composition: <density description> (ACR <A|B|C|D>).

  BI-RADS: <comma-separated categories, e.g. "3" or "3, 5">

  Findings:
  - <finding description, ending with (BI-RADS <value>) when abnormal>
  - <finding description>
  ```

- **Operations:**
  - Normalizes the DMID report headers and wording. DMID reports with no ACR density are dropped, so fewer than 510 DMID reports come out.
  - Builds reports for VinDr-Mammo from `breast-level_annotations.csv` and `finding_annotations.csv`.
  - Removes asymmetry findings from both datasets, because asymmetry cannot be assessed on a single view.
- **Output:** `.txt` reports in `data/dmid/reports-processed/` and `data/vindr-mammo/reports/`.

### 3. `medgemma-split.ipynb`

- **Purpose:** Pairs images with reports and builds the train / validation / test splits.
- **Operations:**
  - Pairs every processed image with its report and drops records whose highest BI-RADS is 0 or 6.
  - Splits per image, stratified by the highest BI-RADS category. Categories 3–5 (including 4a/4b/4c) are split 70/15/15. BI-RADS 1 and 2 then fill validation and test up to 1,000 records each, and the rest go to train.
  - Rebalances the train split only: caps BI-RADS 1 and 2, oversamples 4a/4b/4c/5, and evens out ACR density within each BI-RADS category. Duplicate copies are flagged for live augmentation during training.
- **Output:** a HuggingFace `DatasetDict` in `data/split/`.

### 4. `medgemma-train-eval.ipynb`

- **Purpose:** Fine-tunes MedGemma and evaluates the reports it generates.
- **Operations:**
  - Fine-tunes `google/medgemma-1.5-4b-it` with QLoRA: 4-bit NF4 quantization, bf16 compute, and LoRA rank 16 on all linear layers. `lm_head` and `embed_tokens` are not LoRA layers; they are fully trained (`modules_to_save`).
  - Resizes each image so its longest side is at most 512 px; the model's processor then resizes it to the model's fixed input size.
  - Trains with a per-device batch size of 8 and 32 gradient accumulation steps (effective batch size 256), and keeps the checkpoint with the lowest validation loss.
  - Uploads the trained LoRA adapter to the HuggingFace Hub.
  - Generates a report for every test image with greedy decoding, and reads the model's probabilities for each ACR density and BI-RADS option at the point where it writes them.
  - Computes text-generation metrics (ROUGE, BLEU, METEOR, word-level F1) and classification metrics (accuracy, macro-F1, balanced accuracy with 95% bootstrap confidence intervals).
- **Output:** `eval_predictions.jsonl`, `eval_output.txt`, and `eval_metrics.json` in `results/`.

### 5. `aware-triage-method.ipynb`

- **Purpose:** Simulates the DB-ATRG worklist using the model's predictions.
- **Operations:**
  - Loads `results/eval_predictions.jsonl` and keeps only the cases whose predicted highest BI-RADS matches the reference (`filter_correct=True`).
  - Draws a sample of 100 cases, weighted by an assumed screening-population prevalence of BI-RADS and ACR density.
  - Applies Phase I (pulls out ACR D cases) and Phase II (sorts the rest by the urgency score $S$).
  - Compares the DB-ATRG queue with a FIFO queue: the share of BI-RADS 4/5 cases found in the top 10% of the queue, their mean queue position, the rank shift for each BI-RADS category, and cumulative discovery curves.
- **Output:** ranking CSVs and a five-panel figure in `results/eval_predictions_100_2/`.

---

## Things to Keep in Mind

- **One view per prediction.** The model sees a single 2D view, not the full four-view exam a radiologist reads.
- **VinDr-Mammo reports are generated from label files,** not written by radiologists. Only DMID reports are real radiologist text.
- **The split is per image,** so different views of the same VinDr study can end up in both train and test.
- **The triage simulation only uses correctly predicted cases.** It shows how the queue performs when BI-RADS is predicted correctly, not the model's end-to-end triage performance, which is also affected by BI-RADS errors.

---

## Team

- **Van Phan** — Project Manager & Researcher
- **Nguyen Nhat Cuong Tran** — AI Engineer & Software Engineer
- **Ngo Tan Dat Bui** — Researcher
- **Dr. Russell Jeter** — Advisor

---

## License

This software and research code are shared for academic and research purposes. No `LICENSE` file has been added yet, so no open-source license has been granted.

The datasets are not redistributed here and remain under their own terms. For VinDr-Mammo, that is the PhysioNet data use agreement.
