### Project Name

AutoMammo.ai: The Density and BI-RADS – Aware Triage and Report Generation (DB-ATRG) System

### Your team

Van Phan (Author - Project Manager and Researcher)
Nguyen Nhat Cuong Tran (Author - AI Engineer and Software Engineer)
Ngo Tan Dat Bui (Author - Researcher)
Dr. Russell Jeter (Advisor)

### Problem statement

**Problem Domain:** Mammography is a crucial part of the breast cancer screening process *(Tabár et al., 1985)*; however, current workflows often follow a First-In, First-Out (FIFO) protocol. This approach fails to account for the diagnostic complexity of dense breast tissue, where lesions may be obscured ("masking bias"), leading to high-risk images not being diagnosed in a timely manner. Furthermore, standard workflows typically lack upstream complexity stratification, requiring radiologists to interpret cognitively demanding dense mammograms without prior context. Providing upstream knowledge of case complexity—specifically regarding the "masking effect" in dense tissue—can optimize cognitive resource allocation, thereby reducing workflow fatigue and maintaining high diagnostic consistency throughout the reporting queue.

**Impact Potential:** The DB-ATRG system is projected to have significant clinical and operational impact by:

* **Optimizing Time-to-Diagnosis:** Prioritizing high-risk cases (ACR Density D and BI-RADS 5) for immediate review, significantly reducing the time it takes for the most vulnerable patients to receive a diagnosis.
* **Reducing Workload and Burnout:** Worklist prioritization has been shown in trials (MASAI) to reduce radiologist screen-reading workload by up to 44%.
* **Improving Cancer Detection Outcomes:** AI support in screening has been linked to a 12% reduction in interval cancer diagnoses and a 27% reduction in aggressive subtype cancers.
* **Ensuring Regulatory Compliance:** The system automates breast density and urgency assessments, facilitating compliance with the September 10, 2024, FDA MQSA mandate for patient notification.

### Overall solution

The overall solution is the Density and BI-RADS-Aware Triage and Report Generation (DB-ATRG) system, which leverages the Google **MedGemma 1.5 4B-it** Vision-Language Model *(Sellergren et al., 2025)*. This approach represents an effective use of HAI-DEF models to their fullest potential in two critical clinical areas:

1. **Automated Report Generation:** The MedGemma 1.5 4B model, with its sophisticated medical reasoning and **MedSigLIP Vision Encoder** pre-trained on 33 million medical image-text pairs, is used to accurately generate detailed mammography reports.
2. **Clinical Workflow Optimization (Triage):** The model is fine-tuned to estimate two critical biomarkers—ACR breast density and BI-RADS assessment severity—*prior* to formal radiologist review. This pre-interpretation risk estimation is used to reorder the traditional FIFO worklist based on clinical urgency, effectively targeting the challenge of the "masking effect" and risk-decoupled workflow.

This application is superior to other solutions because it integrates a powerful, domain-adapted foundation model for both report automation and a complexity-aware triage engine, which a purely non-AI or general-purpose AI system could not achieve with the same level of diagnostic consistency and clinical utility.

### Technical details

**Model Architecture and Fine-Tuning:**
The DB-ATRG system is built on the **MedGemma 1.5 4B-it** architecture *(Sellergren et al., 2025)*. To efficiently adapt this 4-billion parameter model for domain-specific tasks and training on standard hardware, we employed **Low-Rank Adaptation (LoRA)** *(Hu et al., 2021)* and its quantized variant,  **QLoRA** .

* **Strategy:** LoRA freezes the main pre-trained weights and trains only lightweight adapter layers, saving memory and computational resources.
* **Quantization:** Weights were quantized into the 4-bit **NormalFloat (NF4)** data type, which is information-theoretically optimal for normally distributed weights.
* **Dataset:** The model was fine-tuned on the publicly available  **Digital Mammography Dataset for Breast Cancer Diagnosis Research (DMID)** *(Oza et al., 2023)*, which includes 510 paired high-resolution mammograms and diagnostic reports.

**Performance:**
The DB-ATRG system demonstrated strong performance on the DMID validation set, outperforming the legacy MedGemma 1.0 baseline *(AMRG; Sung et al., 2025)* across key metrics:

| Performance Metric             | AMRG Baseline (MedGemma 1.0) | DB-ATRG (MedGemma 1.5) |
| ------------------------------ | ---------------------------- | ---------------------- |
| **BLEU-4**               | N/A                          | **0.4730**       |
| **ROUGE-L**              | 0.4968                       | **0.6693**       |
| **METEOR**               | 0.5541                       | **0.7187**       |
| **Word-Level F1**        | 0.4978                       | **0.6789**       |
| **BI-RADS Accuracy**     | 0.3529                       | **0.4276**       |
| **ACR Density Accuracy** | 0.4902                       | **0.7039**       |

**Triage Implementation:**
A dual-phase prioritization framework was implemented:

* **Phase I: Density-Based Flagging:** Automatically flags examinations classified as **ACR Category D** (Extremely Dense) for supplemental screening and complexity-aware review.
* **Phase II: Urgency-Based Prioritization:** Organizes remaining cases using a Cumulative Urgency Score ($S$). The score is calculated as:

  $$
  S = \sum_{i=1}^{N} (B_i)^k - D
  $$

  Where:

  * $\sum_{i=1}^{N} (B_i)^k$: Sum of BI-RADS categories ($B_i$), with $k$ for exponential prioritization.
  * $N$: Total abnormalities.
  * $D$: ACR Density value (A=1, B=2, C=3).

  Higher $S$ values represent higher clinical priority.

**Qualitative Feasibility:**
The DB-ATRG system represents a transformative approach to automated mammography, moving beyond simple detection to comprehensive workflow optimization. By integrating the medical reasoning of MedGemma 1.5 with severity-aware triage, the framework reduces the risk of diagnostic delays for vulnerable patients while simultaneously addressing radiologist burnout. As federal mandates for breast density notification increase clinical volume, such AI-driven infrastructure becomes essential for maintaining high-fidelity, equitable screening programs.

### References

Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., & Chen, W. (2021). *LoRA: Low-rank adaptation of large language models*. arXiv. [https://doi.org/10.48550/arXiv.2106.09685](https://doi.org/10.48550/arXiv.2106.09685)

Oza, P., Oza, R., Oza, U., Sharma, P., Patel, S., Kumar, P., et al. (2023). *Digital mammography dataset for breast cancer diagnosis research (DMID)* [Dataset]. figshare. [https://doi.org/10.6084/m9.figshare.24522883.v2](https://doi.org/10.6084/m9.figshare.24522883.v2)

Sellergren, A., Kazemzadeh, S., Jaroensri, T., Kiraly, A., Traverse, M., Kohlberger, T., et al. (2025). *MedGemma technical report*. arXiv. [https://doi.org/10.48550/arXiv.2507.05201](https://doi.org/10.48550/arXiv.2507.05201)

Sung, N.-J., Lee, D., Choi, B. H., & Park, C. J. (2025). *AMRG: Extend vision language models for automatic mammography report generation*. arXiv. [https://doi.org/10.48550/arXiv.2508.09225](https://doi.org/10.48550/arXiv.2508.09225)

Tabár, L., Gad, A., Holmberg, L. H., Ljungquist, U., Fagerberg, C. J. G., & Baldetorp, L., et al. (1985). *Reduction in mortality from breast cancer after mass screening with mammography: Randomised trial from the Breast Cancer Screening Working Group of the Swedish National Board of Health and Welfare*. The Lancet, 325(8433), 829–832. [https://doi.org/10.1016/S0140-6736(85)92204-4](https://doi.org/10.1016/S0140-6736(85)92204-4)
