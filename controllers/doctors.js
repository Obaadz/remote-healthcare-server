import Devices from "../models/device.js";
import Doctors from "../models/doctor.js";
import Patients from "../models/patient.js";
import { getDeviceByDeviceId } from "./devices.js";

export const insertDoctor = async (doctorData) => {
  const Doctor = new Doctors({
    username: doctorData.username,
    password: doctorData.password,
    age: doctorData.age,
    email: doctorData.email,
    gender: doctorData.gender,
    phoneNumber: doctorData.phoneNumber,
  });

  const [isSuccess, errMessage] = await Doctor.save()
    .then(() => [true, ""])
    .catch((err) => [false, err.message]);

  return { isSuccess, errMessage };
};

export const getDoctor = async (doctorData) => {
  const [isSuccess, errMessage, data] = await Doctors.findOne({
    email: doctorData.email,
    password: doctorData.password,
  })
    .select("-password -__v")
    .populate("patients", "-_id -password -device -__v")
    .then((doctor) => {
      if (doctor) return [true, "", { doctor }];

      return [false, "email or password is incorrect"];
    })
    .catch((err) => [false, err.message]);

  return { isSuccess, errMessage, data };
};

export const insertPatientToDoctor = async (patient, doctorData) => {
  const patientObjectId = await Patients.exists({
    deviceId: patient.deviceId,
  });

  const [isSuccess, errMessage] = await Doctors.updateOne(doctorData, {
    $addToSet: { patients: patientObjectId },
  })
    .then(() => [true, ""])
    .catch((err) => [false, err.message]);

  return { isSuccess, errMessage };
};

export const sendRequestToPatientByDoctorEmail = async (doctorEmail, deviceId) => {
  const doctor = await Doctors.exists({ email: doctorEmail });
  const patientDevice = await getDeviceByDeviceId(deviceId);

  const [isSuccess, errMessage] = await Patients.updateOne(
    { device: patientDevice._id },
    {
      $addToSet: { doctorsRequests: doctor._id },
    }
  )
    .then(() => [true, ""])
    .catch((err) => [false, err.message]);

  return { isSuccess, errMessage };
};

export const cancelRequestToPatientByDoctorEmail = async (doctorEmail, deviceId) => {
  const doctor = await Doctors.exists({ email: doctorEmail });
  const patientDevice = await getDeviceByDeviceId(deviceId);

  const [isSuccess, errMessage] = await Patients.updateOne(
    { device: patientDevice._id },
    {
      $pull: { doctorsRequests: doctor._id },
    }
  )
    .then(() => [true, ""])
    .catch((err) => [false, err.message]);

  return { isSuccess, errMessage };
};
