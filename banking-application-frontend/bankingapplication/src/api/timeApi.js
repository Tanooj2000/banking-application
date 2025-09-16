// Returns system time in format: Saturday 13 Sep 2025 | 9:38 PM
export function getFormattedDateTime() {
	const now = new Date();
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const dayName = days[now.getDay()];
	const day = now.getDate();
	const month = months[now.getMonth()];
	const year = now.getFullYear();
	let hour = now.getHours();
	const minute = now.getMinutes().toString().padStart(2, '0');
	const ampm = hour >= 12 ? 'PM' : 'AM';
	hour = hour % 12;
	if (hour === 0) hour = 12;
	return `${dayName} ${day} ${month} ${year} | ${hour}:${minute} ${ampm}`;
}
