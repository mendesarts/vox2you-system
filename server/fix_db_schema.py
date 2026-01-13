import sqlite3
import uuid

db_path = 'voxflow.sqlite'

def run_migration():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Update ClassSessions table
        print("Checking ClassSessions...")
        cursor.execute("PRAGMA table_info(ClassSessions)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'classId' not in columns:
            print("Adding classId to ClassSessions...")
            cursor.execute("ALTER TABLE ClassSessions ADD COLUMN classId UUID")
        else:
            print("classId exists in ClassSessions.")

        if 'moduleId' not in columns:
            print("Adding moduleId to ClassSessions...")
            cursor.execute("ALTER TABLE ClassSessions ADD COLUMN moduleId UUID")
        else:
            print("moduleId exists in ClassSessions.")
            
        # Clean invalid sessions (optional, but safe since they are orphans)
        cursor.execute("DELETE FROM ClassSessions WHERE classId IS NULL")
        print(f"Deleted orphans from ClassSessions. Rows: {cursor.rowcount}")

        # 2. Update CalendarBlocks table (Code expects unitId/userId)
        print("\nChecking CalendarBlocks...")
        cursor.execute("PRAGMA table_info(CalendarBlocks)")
        columns = [info[1] for info in cursor.fetchall()]

        if 'unitId' not in columns:
             print("Adding unitId to CalendarBlocks...")
             cursor.execute("ALTER TABLE CalendarBlocks ADD COLUMN unitId UUID")

        conn.commit()
        print("\nMigration successful.")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
