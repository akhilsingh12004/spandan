# Spandan AI: Model Training & Scaling Specification
## Comprehensive Guide to Hierarchical Classification, Dataset Curation, and Model Architectures

---

### Executive Overview

As **Spandan AI** scales to encompass **31 Cardiac Conditions** and **29 Dermatological Conditions**, flat monolithic classifiers encounter critical degradation:
1. **Severe Inter-Class Interference**: Monolithic 30+ class softmax heads suffer from catastrophic cross-category confusion (e.g., confusing an artifactual baseline shift with an acute ventricular tachycardia or an infectious fungal ring with an inflammatory eczema plaque).
2. **Extreme Class Imbalance**: Public datasets contain tens of thousands of Normal Sinus Rhythm beats and Melanocytic Nevi, but fewer than 200 instances of Brugada Syndrome or Molluscum Contagiosum.
3. **Clinical Risk Asymmetry**: Missing a life-threatening Ventricular Fibrillation (VFib) or Melanoma has catastrophic clinical consequences compared to misclassifying a benign freckle or sinus bradycardia.

To solve this, Spandan AI implements a **Hierarchical Classification Architecture** with a **Two-Phase Decoupled Deployment Strategy** and **Data-Sparsity / Specialist-Review Transparency**.

---

## 1. Hierarchical Classification Architecture

Instead of a single flat 30+ class softmax classifier, Spandan AI employs a two-tier hierarchical tree:
- **Tier 1 (Branch Classifier)**: Classifies the broad pathophysiological category (e.g. Arrhythmia vs. Ischemic vs. Conduction Block; or Neoplastic vs. Inflammatory vs. Infectious).
- **Tier 2 (Leaf Classifier)**: Runs specialized fine-grained inference within the selected branch, utilizing branch-specific loss weights and feature representations.

```
                                  [Input ECG Strip / Skin Photo]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              [CARDIAC MODULE]        [SKIN MODULE]
                                    │                       │
                       ┌────────────┴────────────┐     ┌────┴────────────────────────┐
                       ▼                         ▼     ▼                             ▼
                 [Tier 1: Broad]           [Tier 1: Broad]             [Tier 1: Broad]
              Rhythm & Arrhythmias        Ischemia & Block            Neoplastic & Pre-Malignant
                       │                         │                             │
                       ▼                         ▼                             ▼
                 [Tier 2: Leaf]            [Tier 2: Leaf]               [Tier 2: Leaf]
            - Normal Sinus Rhythm       - STEMI                      - Melanoma (High Risk)
            - AFib, Flutter             - NSTEMI                     - Basal Cell Carcinoma
            - SVT, VTach, VFib          - LBBB, RBBB, WPW            - Squamous Cell Carcinoma
            - PAC, PVC                  - Heart Blocks (1st/2nd/3rd) - Nevus, Keratosis
```

---

## 2. Module 1: Cardiac Model Training Specification

### 2.1 Complete Taxonomy & Dataset Support Counts

| Broad Category (Tier 1) | Fine-Grained Condition (Tier 2) | Classification Tier | Dataset Support Count (PhysioNet) | Clinical Acuity & Action |
|:---|:---|:---:|:---:|:---|
| **Rhythm & Arrhythmias** | Normal Sinus Rhythm (Baseline) | Core | **Data-Rich (> 50,000)** | Routine baseline |
| | Atrial Fibrillation (AFib) | Core | **Data-Rich (> 8,000)** | Standard cardioversion protocol |
| | Atrial Flutter | Core | **Data-Rich (> 2,500)** | Rate/rhythm control |
| | Sinus Bradycardia | Core | **Data-Rich (> 4,000)** | Monitor hemodynamics |
| | Sinus Tachycardia | Core | **Data-Rich (> 6,000)** | Identify etiology |
| | Premature Ventricular Contractions (PVC) | Core | **Data-Rich (> 7,500)** | Holter monitoring |
| | Ventricular Tachycardia (VTach) | Core | **Moderate (850)** | **Critical / Emergency Alert** |
| | Ventricular Fibrillation (VFib) | Extended | **Sparse (240)** | ⚠️ **Immediate Defibrillation Protocol** |
| | Supraventricular Tachycardia (SVT) | Extended | **Moderate (620)** | Vagal maneuvers / Adenosine |
| | Premature Atrial Contractions (PAC) | Extended | **Data-Rich (> 3,000)** | Clinical observation |
| | Sick Sinus Syndrome | Extended | **Sparse (280)** | ⚠️ **Flag for Specialist Review** |
| **Conduction & Pre-Excitation** | First-degree Heart Block | Core | **Data-Rich (> 2,000)** | PR monitoring |
| | Second-degree Heart Block (Mobitz I/II) | Core | **Moderate (900)** | Telemetry observation |
| | Third-degree (Complete) Heart Block | Core | **Sparse (380)** | ⚠️ **Flag for Pacemaker / Specialist** |
| | Left Bundle Branch Block (LBBB) | Core | **Data-Rich (> 3,500)** | Rule out acute ischemia |
| | Right Bundle Branch Block (RBBB) | Core | **Data-Rich (> 4,000)** | Structural evaluation |
| | Wolff-Parkinson-White Syndrome (WPW) | Extended | **Sparse (190)** | ⚠️ **Flag for Specialist Review (Delta Wave)** |
| **Ischemia & Infarction** | Myocardial Infarction (STEMI) | Core | **Data-Rich (> 5,200)** | **Emergency Cath Lab Activation** |
| | Myocardial Infarction (NSTEMI) | Core | **Data-Rich (> 3,800)** | Urgent cardiology admission |
| | Myocardial Ischemia (ST Depression/T-inv) | Core | **Data-Rich (> 4,500)** | Anti-ischemic therapy |
| **Structural & Hypertrophic** | Left Ventricular Hypertrophy (LVH) | Core | **Data-Rich (> 3,100)** | Echocardiogram correlation |
| | Right Ventricular Hypertrophy (RVH) | Core | **Moderate (750)** | Pulmonary hypertension workup |
| | Atrial Enlargement (Left/Right) | Core | **Moderate (820)** | Valvular screening |
| | Left Axis Deviation (LAD) | Extended | **Data-Rich (> 2,200)** | Hemiblock screening |
| | Right Axis Deviation (RAD) | Extended | **Moderate (650)** | RV strain workup |
| **Channelopathies & Electrolyte** | Long QT Syndrome (LQTS) | Core | **Moderate (580)** | Torsades risk prevention |
| | Short QT Syndrome (SQTS) | Extended | **Very Sparse (< 90)** | ⚠️ **Flag for Specialist Review** |
| | Brugada Syndrome (Type 1/2) | Extended | **Sparse (160)** | ⚠️ **Flag for Specialist Review** |
| | Hyperkalemia (Peaked T Waves) | Extended | **Moderate (450)** | **Stat Calcium Gluconate / Insulin** |
| | Hypokalemia (U Waves / Flat T) | Extended | **Moderate (380)** | Potassium repletion |
| | Pericarditis (Diffuse PR dep / ST elev) | Extended | **Moderate (320)** | Colchicine / NSAIDs |

---

### 2.2 Model Architectures to Train

#### Architecture A: 1D-CNN + BiLSTM Hybrid (Baseline & Phase 1 Core)
- **Input**: 1D Tensor of shape `(Batch, 1000, 1)` representing 4-second strip at 250 Hz.
- **Backbone**:
  - `Conv1D(filters=32, kernel=7, stride=1, padding='same')` + `BatchNorm` + `ReLU` + `MaxPool1D(2)`
  - `Conv1D(filters=64, kernel=5, stride=1, padding='same')` + `BatchNorm` + `ReLU` + `MaxPool1D(2)`
  - `Conv1D(filters=128, kernel=5, stride=1, padding='same')` + `BatchNorm` + `ReLU` + `MaxPool1D(2)`
  - `Bidirectional(LSTM(64, return_sequences=False))`
- **Dense Head**: `Dense(128, activation='relu')` + `Dropout(0.3)` + `Dense(N_classes, activation='softmax')`.
- **Loss Function**: Focal Loss ($\gamma = 2.0, \alpha = \text{class\_weights}$) or Weighted Categorical Cross-Entropy.

#### Architecture B: Multi-Lead Residual 1D-ResNet (Phase 2 Full Scaling)
- For 12-lead multi-channel recordings `(Batch, 1000, 12)`:
  - 4 Residual blocks with skip connections and Squeeze-and-Excitation (SE) temporal attention.
  - Receptive field covers both local rapid QRS spikes ($<100\text{ ms}$) and long-term rhythm pauses ($>3000\text{ ms}$).

#### Architecture C: Prototypical Few-Shot Metric Learner (For Rare Classes)
- For classes with $<200$ samples (Brugada, WPW, Short QT):
  - Train an embedding backbone $f_\theta(x) \in \mathbb{R}^{128}$ using contrastive triplet loss:
    $$\mathcal{L}_{\text{triplet}} = \max\left(0, \|f(a) - f(p)\|^2 - \|f(a) - f(n)\|^2 + \alpha\right)$$
  - At inference time, compute cosine distance to prototype centroids formed by confirmed clinical exemplars.
  - If minimum distance exceeds distance threshold $\tau$, mark prediction as **"Uncertain / Specialist Consultation Required"**.

---

## 3. Module 2: Skin Model Training Specification

### 3.1 Complete Taxonomy & Dataset Support Counts

| Broad Category (Tier 1) | Fine-Grained Condition (Tier 2) | Classification Tier | Dataset Support Count (ISIC / HAM10k / DermNet) | Clinical Acuity & Action |
|:---|:---|:---:|:---:|:---|
| **Neoplastic & Pre-Malignant** | Melanoma | Core | **Data-Rich (1,113)** | ⚠️ **Urgent Biopsy / Excision** |
| | Basal Cell Carcinoma (BCC) | Core | **Data-Rich (2,100)** | Surgical excision / Mohs |
| | Squamous Cell Carcinoma (SCC) | Core | **Moderate (650)** | Biopsy and staging |
| | Actinic Keratosis (AKIEC) | Core | **Moderate (860)** | Cryotherapy / 5-FU |
| | Melanocytic Nevus (Normal Mole) | Core | **Data-Rich (> 6,700)** | Routine observation |
| | Benign Keratosis (BKL) | Core | **Data-Rich (1,099)** | Reassurance / Cosmetic removal |
| | Dermatofibroma (DF) | Core | **Moderate (315)** | Dimple sign / Observation |
| | Vascular Lesion (VASC) | Core | **Moderate (285)** | Pulsed-dye laser / Monitor |
| **Inflammatory & Autoimmune** | Eczema (Atopic Dermatitis) | Core | **Data-Rich (> 1,800)** | Topical corticosteroids / Emollients |
| | Psoriasis | Core | **Data-Rich (> 1,600)** | Biologics / Topical vitamin D |
| | Contact Dermatitis | Core | **Moderate (920)** | Patch testing / Allergen avoidance |
| | Rosacea | Core | **Moderate (780)** | Topical metronidazole / Lifestyle |
| | Urticaria (Hives) | Core | **Moderate (650)** | Second-gen H1 antihistamines |
| | Lichen Planus | Extended | **Sparse (280)** | ⚠️ **Flag for Specialist Review** |
| | Seborrheic Dermatitis | Extended | **Data-Rich (> 1,200)** | Antifungal shampoo (Ketoconazole) |
| | Alopecia Areata | Extended | **Moderate (420)** | Intralesional triamcinolone |
| | Keloid / Hypertrophic Scar | Extended | **Moderate (510)** | Silicone gel sheets / Injections |
| **Infectious** | Ringworm / Fungal (Tinea Corporis) | Core | **Data-Rich (> 1,400)** | Topical terbinafine / Clotrimazole |
| | Herpes Zoster (Shingles) | Extended | **Moderate (620)** | Stat Oral Valacyclovir ($<72\text{h}$) |
| | Impetigo | Extended | **Moderate (480)** | Topical mupirocin / Oral cephalexin |
| | Scabies | Extended | **Sparse (340)** | ⚠️ **Permethrin 5% (Treat Household)** |
| | Cellulitis | Extended | **Moderate (390)** | ⚠️ **Urgent Systemic Antibiotics** |
| | Warts (Verruca / HPV) | Extended | **Data-Rich (> 1,100)** | Salicylic acid / Cryosurgery |
| | Tinea Versicolor | Extended | **Moderate (530)** | Selenium sulfide / Ketoconazole |
| | Molluscum Contagiosum | Extended | **Sparse (210)** | ⚠️ **Flag for Specialist Review** |
| | Chickenpox (Varicella) | Extended | **Sparse (190)** | Calamine / Symptomatic isolation |
| **Appendageal & Pigmentary** | Normal / Healthy Skin (Baseline) | Core | **Data-Rich (> 5,000)** | Healthy control |
| | Acne Vulgaris | Core | **Data-Rich (> 2,400)** | Retinoids / Benzoyl peroxide |
| | Vitiligo | Core | **Moderate (670)** | Phototherapy / Tacrolimus |

---

### 3.2 Model Architectures to Train

#### Architecture A: EfficientNet-B0 / MobileNetV3 Transfer Learner
- **Input**: `(Batch, 224, 224, 3)` RGB normalized to `[0, 1]`.
- **Pretrained Weights**: ImageNet-1k initialized.
- **Fine-Tuning Strategy**:
  1. **Stage 1 (Linear Probing)**: Freeze backbone completely; train top dense classifier for 5 epochs with $\text{LR} = 10^{-3}$.
  2. **Stage 2 (Progressive Unfreezing)**: Unfreeze top 30 layers; train with cosine decay learning rate schedule ($\text{LR}_{\max} = 10^{-4}, \text{LR}_{\min} = 10^{-6}$).
- **Data Augmentation Pipeline**:
  - `RandomFlip("horizontal_and_vertical")`
  - `RandomRotation(0.25)`
  - `RandomZoom(0.20)`
  - `RandomBrightness(0.15)`
  - `RandomContrast(0.20)`
  - **Color Jitter (Fitzpatrick Scale Adaptation)**: Perturbations in CIE-LAB space to simulate varied skin phototypes without shifting lesion chrominance.

#### Architecture B: Hierarchical Dual-Head Vision Transformer (ViT-Small / Swin-T)
- **Patch Size**: $16 \times 16$
- **Dual Head**:
  - **Head 1**: Predicts 4 broad categories (Neoplastic, Inflammatory, Infectious, Appendageal).
  - **Head 2**: Conditioned on Head 1 features, predicts specific fine-grained diagnosis.
- **Asymmetric Cost Matrix**:
  $$\text{Cost}(\text{True: Melanoma}, \text{Pred: Nevus}) = 10.0$$
  $$\text{Cost}(\text{True: Nevus}, \text{Pred: Melanoma}) = 1.0$$
  This ensures the training loss heavily penalizes false negatives on fatal malignancies.

---

## 4. Training Datasets & Sources

### Cardiac Data Sources:
1. **MIT-BIH Arrhythmia Database** (PhysioNet): 48 half-hour two-channel ambulatory ECG recordings with beat-by-beat clinical annotations.
2. **PTB-XL Dataset** (PhysioNet): 21,837 clinical 12-lead ECGs from 18,885 patients, with comprehensive SCP-ECG diagnostic statements.
3. **CPSC 2018 (China Physiological Signal Challenge)**: Multi-lead arrhythmia recordings focusing on AFib, PVC, LBBB, and RBBB.
4. **PhysioNet/Computing in Cardiology Challenge 2020/2021**: Extensive cohort spanning rarer conditions (Brugada, WPW, pacing rhythms).

### Skin Data Sources:
1. **HAM10000 Dataset**: 10,015 dermatoscopic images spanning 7 primary diagnostic categories.
2. **ISIC Archive (2018, 2019, 2020 Grand Challenges)**: Over 35,000 high-resolution lesion photos with ground-truth histopathology confirmation.
3. **Fitzpatrick17k Dataset**: 16,577 clinical photographs annotated with Fitzpatrick skin phototypes (I to VI) to guarantee fairness and skin tone robustness.
4. **DermNet NZ & Dermofit Image Library**: High-quality clinical photography for inflammatory (Lichen Planus, Seborrheic Dermatitis) and infectious conditions (Shingles, Molluscum, Scabies).

---

## 5. Model Training Execution Scripts

The repository includes ready-to-run training pipelines:

```bash
# Train Phase 1 Cardiac 1D-CNN + BiLSTM model
cd backend
python ml/train_cardiac.py

# Train Phase 1 Skin Transfer-Learning CNN model
python ml/train_skin.py

# Run Full Robustness, Latency, and Explainability Benchmarks
python ml/robustness_test.py
```

### Key Training Hyperparameters:
```python
BATCH_SIZE = 32
CARDIAC_LEARNING_RATE = 1e-3
SKIN_LEARNING_RATE = 5e-4
WEIGHT_DECAY = 1e-4
EARLY_STOPPING_PATIENCE = 4
REDUCE_LR_FACTOR = 0.5
REDUCE_LR_PATIENCE = 2
```

---

## 6. Evaluation Metrics & Audit Standards

To validate readiness for clinical evaluation and academic review:
1. **Stratification Standard**: Split strictly by **Patient ID** for ECG (`GroupShuffleSplit`) to prevent beat leakage; split with **Stratified Sampling** for dermatology to maintain class ratios.
2. **Primary Metric for Malignancies**: **Recall (Sensitivity) $\ge 92\%$** on Melanoma, Basal Cell Carcinoma, and Acute Infarctions (STEMI).
3. **Primary Metric for Arrhythmias**: **Macro F1-Score $\ge 0.88$**.
4. **Explainability Sanity Test**: Grad-CAM activations must overlap $>70\%$ with clinician-annotated bounding boxes or ST/QRS intervals.
5. **Transparency Badge**: Any prediction with dataset support $<300$ samples must display the **"⚠️ Flagged for Specialist Review"** badge.
