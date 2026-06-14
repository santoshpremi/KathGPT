use serde::Serialize;

/// How much RAM is available for loading local models (after a small OS reserve).
const OS_RESERVE_GB: f64 = 2.0;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareProfile {
    pub total_ram_gb: u8,
    /// RAM budget used for model compatibility checks.
    pub effective_ram_gb: u8,
    pub platform: String,
    pub arch: String,
    pub gpu_hint: GpuHint,
    /// Best catalog pick for this machine (may still require download).
    pub recommended_model: Option<String>,
    /// Quantization tier picked for this machine (e.g. Q4_K_M, Q8_0).
    pub recommended_quant: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum GpuHint {
    AppleMetal,
    Cuda,
    Cpu,
}

pub fn detect() -> HardwareProfile {
    let (total_bytes, total_gb) = total_memory_bytes();
    let effective_ram_gb = effective_ram_gb_from_total(total_bytes);

    let arch = std::env::consts::ARCH.to_string();
    let platform = std::env::consts::OS.to_string();
    let gpu_hint = detect_gpu_hint(&platform, &arch);

    let recommended_model = crate::llm::model_catalog::recommended_for_ram(effective_ram_gb)
        .map(|e| e.name.to_string());
    let recommended_quant = crate::llm::model_catalog::recommended_for_ram(effective_ram_gb)
        .map(|e| e.quant.to_string());

    HardwareProfile {
        total_ram_gb: total_gb,
        effective_ram_gb,
        platform,
        arch,
        gpu_hint,
        recommended_model,
        recommended_quant,
    }
}

fn total_memory_bytes() -> (u64, u8) {
    if let Ok(mock_gb) = std::env::var("KATHAGPT_MOCK_RAM_GB") {
        if let Ok(gb) = mock_gb.parse::<u64>() {
            let bytes = gb.saturating_mul(1024 * 1024 * 1024);
            return (bytes, bytes_to_gb_u8(bytes));
        }
    }

    let mut sys = sysinfo::System::new();
    sys.refresh_memory();
    let total_bytes = sys.total_memory();
    (total_bytes, bytes_to_gb_u8(total_bytes))
}

fn detect_gpu_hint(platform: &str, arch: &str) -> GpuHint {
    match platform {
        "macos" => GpuHint::AppleMetal,
        "windows" | "linux" if arch == "x86_64" || arch == "aarch64" => {
            // Dedicated VRAM detection needs platform-specific APIs; CPU fallback is safe.
            if std::env::var("CUDA_VISIBLE_DEVICES").is_ok() {
                GpuHint::Cuda
            } else {
                GpuHint::Cpu
            }
        }
        _ => GpuHint::Cpu,
    }
}

pub fn effective_ram_gb_from_total(total_bytes: u64) -> u8 {
    let total_gb = total_bytes as f64 / (1024.0 * 1024.0 * 1024.0);
    if total_gb <= 0.0 {
        return 4;
    }
    let effective = (total_gb - OS_RESERVE_GB).floor().max(1.0) as u8;
    effective.max(2)
}

fn bytes_to_gb_u8(bytes: u64) -> u8 {
    let gb = bytes as f64 / (1024.0 * 1024.0 * 1024.0);
    gb.round().max(1.0) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn effective_ram_reserves_headroom() {
        assert_eq!(effective_ram_gb_from_total(8 * 1024 * 1024 * 1024), 6);
        assert_eq!(effective_ram_gb_from_total(16 * 1024 * 1024 * 1024), 14);
        assert_eq!(effective_ram_gb_from_total(4 * 1024 * 1024 * 1024), 2);
    }
}
