// Data Transfer Object for Report entities
// Normalizes field naming (snake_case -> camelCase) and flattens relations.
// photos can arrive either as array of photo entities ({ link }) or raw string URLs.
class ReportDTO {
    constructor({
        id,
        title,
        description,
        status,
        latitude,
        longitude,
        reject_explanation,
        userId,
        categoryId,
        photos,
        isAnonymous
    }) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.rejectExplanation = reject_explanation ?? null;
        this.userId = userId;
        this.categoryId = categoryId;
        this.photos = Array.isArray(photos)
            ? photos.map(p => typeof p === 'string' ? p : p.link).filter(Boolean)
            : [];
        this.isAnonymous = isAnonymous ?? false;
    }
}

export default ReportDTO;