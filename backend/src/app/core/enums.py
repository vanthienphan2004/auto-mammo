from enum import Enum


class SexType(Enum):
    MALE = 0
    FEMALE = 1


class UrgencyLevel(Enum):
    LOW = 0


class QueueStatus(Enum):
    REVIEW = 0
