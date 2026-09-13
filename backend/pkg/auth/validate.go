package auth

import (
	"errors"
	"regexp"
	"social-network-test/pkg/models"
	"strings"
	"time"
	"unicode"
)

var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

const (
	dobLayout = "2006-01-02"
	minAge    = 13
	maxAge    = 120

	nicknameMinLen = 3
	nicknameMaxLen = 13

	aboutMeMinLen = 3
	aboutMeMaxLen = 150
)

func ValidateRegisterRequest(req *models.RegisterRequest) error {
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Email = strings.TrimSpace(req.Email)
	req.DOB = strings.TrimSpace(req.DOB)
	req.Nickname = strings.TrimSpace(req.Nickname)
	req.AboutMe = strings.TrimSpace(req.AboutMe)

	if len(req.FirstName) < 1 || len(req.FirstName) > 50 {
		return errors.New("first name must be between 1 and 50 characters")
	}
	if len(req.LastName) < 1 || len(req.LastName) > 50 {
		return errors.New("last name must be between 1 and 50 characters")
	}
	if !emailPattern.MatchString(req.Email) {
		return errors.New("invalid email format")
	}
	if err := ValidateDOB(req.DOB); err != nil {
		return err
	}
	if err := ValidateNickname(req.Nickname); err != nil {
		return err
	}
	if err := ValidateAboutMe(req.AboutMe); err != nil {
		return err
	}
	if err := ValidatePasswordStrength(req.Password); err != nil {
		return err
	}
	return nil
}

func ValidateDOB(dob string) error {
	if dob == "" {
		return errors.New("date of birth is required")
	}
	parsed, err := time.Parse(dobLayout, dob)
	if err != nil {
		return errors.New("date of birth must be in YYYY-MM-DD format")
	}
	if parsed.After(time.Now()) {
		return errors.New("date of birth cannot be in the future")
	}
	if age := calculateAge(parsed); age < minAge {
		return errors.New("you must be at least 13 years old to register")
	} else if age > maxAge {
		return errors.New("date of birth is invalid")
	}
	return nil
}

func calculateAge(dob time.Time) int {
	now := time.Now()
	age := now.Year() - dob.Year()
	if now.Month() < dob.Month() || (now.Month() == dob.Month() && now.Day() < dob.Day()) {
		age--
	}
	return age
}

func ValidateNickname(nickname string) error {
	if nickname == "" {
		return nil
	}
	if len(nickname) < nicknameMinLen {
		return errors.New("nickname must be at least 3 characters")
	}
	if len(nickname) > nicknameMaxLen {
		return errors.New("nickname must be at most 13 characters")
	}
	for _, c := range nickname {
		if !unicode.IsLetter(c) && !unicode.IsDigit(c) {
			return errors.New("nickname must contain only letters and numbers")
		}
	}
	return nil
}

func ValidateAboutMe(aboutMe string) error {
	if aboutMe == "" {
		return nil
	}
	if len(aboutMe) < aboutMeMinLen {
		return errors.New("about me must be at least 3 characters")
	}
	if len(aboutMe) > aboutMeMaxLen {
		return errors.New("about me must be at most 150 characters")
	}
	for _, c := range aboutMe {
		if !unicode.IsLetter(c) && !unicode.IsDigit(c) && c != ' ' {
			return errors.New("about me must contain only letters, numbers, and spaces")
		}
	}
	return nil
}

func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	var hasUpper, hasDigit, hasLower, hasSpecialCharacter bool

	specialCharacters := "!@#$%&()*_"

	for _, c := range password {
		if unicode.IsUpper(c) {
			hasUpper = true
		}
		if unicode.IsDigit(c) {
			hasDigit = true
		}
		if unicode.IsLower(c) {
			hasLower = true
		}
	}

	if strings.ContainsAny(password, specialCharacters) {
		hasSpecialCharacter = true
	}

	if !hasUpper || !hasLower || !hasSpecialCharacter || !hasDigit {
		return errors.New("password must contain at least one uppercase letter, one lowercase letter, one digit and one number")
	}
	return nil
}
