import otpGenerator from "otp-generator";

interface OtpData {
  otp: string;
  expiry: number;
}

class OtpService {
  private otpStore: Map<string, OtpData> = new Map();

  generateOtp(phone: string): string {
    const otp = otpGenerator.generate(6, { digits: true });
    const expiry = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
    this.otpStore.set(phone, { otp, expiry });
    return otp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const otpData = this.otpStore.get(phone);

    if (!otpData) return false;

    if (Date.now() > otpData.expiry) {
      this.otpStore.delete(phone);
      return false;
    }

    const isValid = otpData.otp === otp;
    if (isValid) {
      this.otpStore.delete(phone);
    }
    return isValid;
  }
}

export const otpService = new OtpService();
