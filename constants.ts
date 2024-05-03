export const RES_STATUS = {
    success: "success",
    fail: "fail",
    error: "error"
};

export const PAGINATION = {
    default: {
        page: 1,
        size: 20
    }
}

export const EXPIRATION = {
    quarterOfHour: 900000,
    quarterToADay: 64800000,
    oneWeekDays: 432000000
}

export const SIGNER_EMAIL = "gerswynauldric.lu.cics@ust.edu.ph";

export const qrMessage = (fullName: string) => `
<h1>Hi ${fullName},</h1>
<p>You recently requested to generate a new QR Code to verify your account access.</p>
<p>Please scan the attached QR Code below using your Google Authentication app.</p>
<hr />
<p>For further questions, please contact the respective admin in your department about this product.</p>
<p>Thanks,
  <br>The UST Tally Team</p>
`