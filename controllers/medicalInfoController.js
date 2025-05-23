const MedicalInfo = require('../models/MedicalInfo');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Get all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .select('name specialty experience qualifications');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching doctors' });
  }
};

// Create medical info/appointment
exports.createMedicalInfo = async (req, res) => {
  try {
    const { doctorId, date, time, reason, symptoms, notes } = req.body;
    const patientId = req.user._id;

    // Get doctor's availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if doctor is available on the selected day
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!doctor.availability.daysAvailable.includes(dayOfWeek)) {
      return res.status(400).json({ error: 'Doctor is not available on this day' });
    }

    // Check if the time is within working hours
    const [appointmentHour] = time.split(':');
    const [startHour] = doctor.availability.workingHours.start.split(':');
    const [endHour] = doctor.availability.workingHours.end.split(':');

    const appointmentHourNum = parseInt(appointmentHour);
    const startHourNum = parseInt(startHour);
    const endHourNum = parseInt(endHour);

    // Handle overnight shifts (e.g., 22:00 - 10:00)
    let isWithinWorkingHours;
    if (startHourNum > endHourNum) {
      // For overnight shifts, time is valid if it's after start time OR before end time
      isWithinWorkingHours = appointmentHourNum >= startHourNum || appointmentHourNum < endHourNum;
    } else {
      // For normal shifts, time must be between start and end
      isWithinWorkingHours = appointmentHourNum >= startHourNum && appointmentHourNum < endHourNum;
    }

    if (!isWithinWorkingHours) {
      return res.status(400).json({ error: 'Appointment time is outside working hours' });
    }

    // Check if there's already an appointment at this time
    const existingAppointment = await MedicalInfo.findOne({
      doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59))
      },
      time,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Create new medical info/appointment
    const medicalInfo = new MedicalInfo({
      patientId,
      doctorId,
      date: appointmentDate,
      time,
      reason,
      symptoms,
      notes,
      status: 'pending'
    });

    await medicalInfo.save();

    // Populate doctor and patient details
    await medicalInfo.populate('doctorId', 'name specialty');
    await medicalInfo.populate('patientId', 'name');

    res.status(201).json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get patient's medical info/appointments
exports.getPatientMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialty')
      .sort({ date: -1 });
    res.json(medicalInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medical info' });
  }
};

// Get doctor's medical info/appointments
exports.getDoctorMedicalInfo = async (req, res) => {
  try {
    const medicalInfo = await MedicalInfo.find({ doctorId: req.user._id })
      .populate('patientId', 'name')
      .sort({ date: -1 });
    res.json(medicalInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching medical info' });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const appointments = await MedicalInfo.find({ doctorId: req.user._id })
      .populate('patientId', 'name')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get patient's appointments
exports.getPatientAppointments = async (req, res) => {
  try {
    if (req.userType !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Patients only.' });
    }

    const appointments = await MedicalInfo.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialty')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    if (req.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Doctors only.' });
    }

    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await MedicalInfo.findOne({
      _id: appointmentId,
      doctorId: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    await appointment.populate('patientId', 'name');
    await appointment.populate('doctorId', 'name specialty');

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update medical info status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const medicalInfo = await MedicalInfo.findById(req.params.id);

    if (!medicalInfo) {
      return res.status(404).json({ error: 'Medical info not found' });
    }

    if (medicalInfo.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    medicalInfo.status = status;
    if (notes) medicalInfo.notes = notes;
    await medicalInfo.save();

    res.json(medicalInfo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get doctor's appointments for a specific date
exports.getDoctorAppointmentsByDate = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    // Create date range for the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const appointments = await MedicalInfo.find({
      doctorId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['pending', 'confirmed'] }
    }).select('time status');

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments by date:', error);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
}; 